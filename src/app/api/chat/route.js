import { success, error as errorResponse, notFound } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { chatCompletion, getBackend } from '@/lib/llm/provider';
import { parseStream, createSSEStream } from '@/lib/llm/streaming';
import { buildSystemPrompt } from '@/lib/llm/prompts';
import { retrieveRelevantMemories, retrieveMemoriesSeparated } from '@/lib/memory/retrieval';
import { getToolDefinitions, executeTool } from '@/lib/tools/registry';
import { buildAnalysisPrompt } from '@/lib/prompts/analysis-prompt';
import { processAnalysis, getAvailableModules } from '@/lib/analysis/process-analysis';
import { detectModelFamily, buildOllamaThinkParam, buildLlamacppThinkParams } from '@/lib/llm/thinking';
import { getSettingValue } from '@/lib/utils/format';

import { DEFAULT_MAIN_MODEL } from '@/lib/constants';

const DEFAULT_MODEL = process.env.CORTEX_DEFAULT_MAIN_MODEL || DEFAULT_MAIN_MODEL;

function getMainModel(db, overrideModel) {
  return overrideModel || getSettingValue(db, 'main_model', DEFAULT_MODEL);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, message, model, reasoningLevel, attachments, enabledTools, samplingParams, projectId, systemPromptOverride, extraAnalyze } = body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return errorResponse('Message is required', 400);
    }
    const db = getDb();

    const convId = conversationId || await createConversation(db, model, projectId, systemPromptOverride);
    saveUserMessage(db, convId, message, reasoningLevel);

    const activeClusters = getActiveClusters(db);

    // Determine analysis timeout from settings
    let analysisTimeoutMs = 10000;
    try {
      const timeoutSetting = db.prepare("SELECT value FROM settings WHERE key = 'analysis_timeout'").get();
      if (timeoutSetting) {
        const parsed = JSON.parse(timeoutSetting.value);
        if (typeof parsed === 'number' && parsed > 0) analysisTimeoutMs = parsed * 1000;
      }
    } catch { /* use default */ }

    // Create SSE stream early so analysis events stream to client in real-time
    const { stream, send, close, error: streamError } = createSSEStream();
    const ollamaOptions = samplingParams && typeof samplingParams === 'object' ? { ...samplingParams } : {};

    // Run entire pipeline (analysis → context → chat) in background
    // so the Response returns immediately and SSE events stream in real-time
    (async () => {
      try {

    // --- Streaming Pre-Analysis Pass ---
    let enrichedContext = null;
    let analysisResult = null;

    if (extraAnalyze) {
      send({ type: 'analysis_start' });
      try {
        const analysisStart = Date.now();

        // Get available module namespaces dynamically from tool registry
        const availableModules = getAvailableModules();
        const activeClusterNames = activeClusters.map(c => c.name);

        // Get recently used modules from last 5 assistant messages with tool calls
        const recentToolMessages = db.prepare(
          "SELECT tool_calls FROM messages WHERE conversation_id = ? AND role = 'assistant' AND tool_calls IS NOT NULL ORDER BY created_at DESC LIMIT 5"
        ).all(convId);
        const recentModulesUsed = [];
        for (const row of recentToolMessages) {
          try {
            const calls = JSON.parse(row.tool_calls);
            if (Array.isArray(calls)) {
              for (const tc of calls) {
                const name = tc.function?.name ?? '';
                const dot = name.indexOf('.');
                if (dot > 0) {
                  const ns = name.slice(0, dot);
                  if (!recentModulesUsed.includes(ns)) recentModulesUsed.push(ns);
                }
              }
            }
          } catch { /* skip malformed */ }
        }

        const analysisPrompt = buildAnalysisPrompt(availableModules, activeClusterNames, recentModulesUsed);

        const analysisModel = getMainModel(db, model);

        // Include recent conversation history so the analyzer can understand references like "log it"
        const recentHistory = db.prepare(
          "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6"
        ).all(convId).reverse();

        const analysisMessages = [
          { role: 'system', content: analysisPrompt },
        ];
        // Add recent conversation as context (truncated to save tokens)
        if (recentHistory.length > 0) {
          const contextSummary = recentHistory.map(m =>
            `[${m.role}]: ${(m.content || '').slice(0, 300)}`
          ).join('\n');
          analysisMessages.push({
            role: 'user',
            content: `<recent_conversation>\n${contextSummary}\n</recent_conversation>\n\nAnalyze this new message:\n${message}`,
          });
        } else {
          analysisMessages.push({ role: 'user', content: message });
        }

        // Streaming analysis call — thinking + content stream to the client in real-time
        const analysisResponse = await chatCompletion({
          model: analysisModel,
          messages: analysisMessages,
          stream: true,
          options: { temperature: 0.1 },
          // Don't disable thinking — stream the model's reasoning to the analyzer panel
        });

        let analysisThinking = '';
        let rawAnalysisText = '';

        for await (const chunk of parseStream(analysisResponse, getBackend())) {
          if (chunk.message?.thinking) {
            analysisThinking += chunk.message.thinking;
            send({ type: 'analysis_thinking', content: chunk.message.thinking });
          }
          if (chunk.message?.content) {
            rawAnalysisText += chunk.message.content;
            send({ type: 'analysis_content', content: chunk.message.content });
          }
          if (chunk.done) break;
        }

        const analysisTimeMsElapsed = Date.now() - analysisStart;

        // Process and enrich
        enrichedContext = await processAnalysis(rawAnalysisText, message);

        if (enrichedContext) {
          analysisResult = {
            ...enrichedContext.analysis,
            analysis_time_ms: analysisTimeMsElapsed,
            tools_loaded: enrichedContext.filteredTools.length,
            tools_total: getToolDefinitions().length,
            memories_found: enrichedContext.memories.length,
            pre_fetched_keys: Object.keys(enrichedContext.preFetchedData),
            thinking: analysisThinking,
            rawText: rawAnalysisText,
          };
        }
        send({ type: 'analysis_result', data: analysisResult || { failed: true, error: 'Failed to parse analysis response' } });
      } catch (err) {
        console.error('[analysis] Pre-analysis failed, falling back to standard flow:', err?.message ?? err);
        analysisResult = { failed: true, error: err?.message ?? 'Analysis failed', modules: [], confidence: 0 };
        send({ type: 'analysis_result', data: analysisResult });
      }
    }

    // --- Standard flow (with or without enriched context) ---
    let memories;
    let clusterMemories = [];
    let tools;

    if (enrichedContext) {
      // Use enriched memories and filtered tools from analysis
      memories = enrichedContext.memories;
      tools = enrichedContext.filteredTools;
    } else {
      // Standard: retrieve global and cluster memories separately so the
      // cluster memories reach their dedicated prompt section
      const activeClusterIds = activeClusters.map(c => c.id);
      const separated = await retrieveMemoriesSeparated({ query: message, clusterIds: activeClusterIds });
      memories = separated.memories;
      clusterMemories = separated.clusterMemories;
      tools = getToolDefinitions();
    }

    // Apply user's tool toggles on top
    if (enabledTools) {
      if (enabledTools.tools === false) {
        tools = [];
      }
      if (enabledTools.web_search === false) {
        tools = tools.filter(t => !t.function?.name?.startsWith('search.'));
      }
    }

    // Fetch project system prompt and per-chat override
    const conv = db.prepare('SELECT project_id, system_prompt_override FROM conversations WHERE id = ?').get(convId);
    let projectPrompt = null;
    if (conv?.project_id) {
      const project = db.prepare('SELECT system_prompt FROM projects WHERE id = ?').get(conv.project_id);
      projectPrompt = project?.system_prompt || null;
    }

    const systemPrompt = buildSystemPrompt({
      reasoningLevel: reasoningLevel || 'medium',
      memories,
      clusters: activeClusters,
      clusterMemories,
      tools,
      projectPrompt,
      chatPromptOverride: conv?.system_prompt_override || null,
      enrichedContext: enrichedContext || undefined,
    });

    const history = getMessageHistory(db, convId);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];
    const mainModel = getMainModel(db, model);

    // Send debug info so the frontend can show exact inputs
    send({ type: 'debug', systemPrompt, messagesCount: messages.length, projectPrompt: projectPrompt || null, model: mainModel });

    await streamChat({ db, convId, mainModel, messages, tools, send, close, streamError, reasoningLevel, ollamaOptions });

      } catch (pipelineErr) {
        console.error('[pipeline] Fatal error:', pipelineErr);
        streamError(pipelineErr);
      }
    })();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

async function streamChat({ db, convId, mainModel, messages, tools, send, close, streamError, reasoningLevel, ollamaOptions }) {
  try {
    // Detect model family and build the correct thinking params
    const backend = getBackend();
    const family = detectModelFamily(mainModel);
    let thinkParam;
    let extraBodyParams = {};

    if (backend === 'llamacpp') {
      // llama-server: each model family uses different API params
      extraBodyParams = buildLlamacppThinkParams(family, reasoningLevel);
    } else {
      // Ollama: uses native think param, handles model specifics internally
      thinkParam = buildOllamaThinkParam(family, reasoningLevel);
    }

    const res = await chatCompletion({ model: mainModel, messages, tools, stream: true, options: ollamaOptions, think: thinkParam, extraBody: extraBodyParams });
    let fullContent = '';
    let thinkingContent = '';
    let toolCalls = [];
    let tokenStats = null;

    for await (const chunk of parseStream(res, getBackend())) {
      // Ollama returns thinking in message.thinking when think=true
      if (chunk.message?.thinking) {
        thinkingContent += chunk.message.thinking;
        send({ type: 'thinking', content: chunk.message.thinking, conversationId: convId });
      }
      if (chunk.message?.content) {
        fullContent += chunk.message.content;
        send({ type: 'content', content: chunk.message.content, conversationId: convId });
      }
      if (chunk.message?.tool_calls) {
        toolCalls = chunk.message.tool_calls;
      }
      if (chunk.done) {
        tokenStats = {
          prompt_tokens: chunk.prompt_eval_count || 0,
          completion_tokens: chunk.eval_count || 0,
          total_tokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
          eval_duration_ms: chunk.eval_duration ? Math.round(chunk.eval_duration / 1e6) : 0,
          total_duration_ms: chunk.total_duration ? Math.round(chunk.total_duration / 1e6) : 0,
          tokens_per_second: chunk.eval_count && chunk.eval_duration
            ? Math.round((chunk.eval_count / (chunk.eval_duration / 1e9)) * 10) / 10
            : 0,
        };
        break;
      }
    }

    if (toolCalls.length > 0) {
      await handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel, ollamaOptions, tools, tokenStats, thinkParam, extraBodyParams });
      return;
    }

    // Store thinking content with the message for persistence
    const contentToSave = thinkingContent
      ? `<think>${thinkingContent}</think>\n${fullContent}`
      : fullContent;
    saveAssistantMessage(db, convId, contentToSave, null, reasoningLevel, tokenStats);
    updateConversationTitle(db, convId, fullContent);
    send({ type: 'done', conversationId: convId, tokenStats });
    close();
  } catch (err) {
    streamError(err);
  }
}

async function handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel, ollamaOptions, tools, tokenStats: initialStats, thinkParam, extraBodyParams = {} }) {
  const MAX_TOOL_ROUNDS = 10;
  try {
    let currentMessages = [...messages];
    let currentToolCalls = toolCalls;
    let currentContent = fullContent;
    // Accumulate token stats across all rounds
    let totalStats = {
      prompt_tokens: initialStats?.prompt_tokens || 0,
      completion_tokens: initialStats?.completion_tokens || 0,
      total_tokens: initialStats?.total_tokens || 0,
      eval_duration_ms: initialStats?.eval_duration_ms || 0,
      total_duration_ms: initialStats?.total_duration_ms || 0,
      tokens_per_second: initialStats?.tokens_per_second || 0,
      _tps_sum: initialStats?.tokens_per_second || 0,
      _tps_count: initialStats?.tokens_per_second ? 1 : 0,
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const toolResults = [];

      for (const tc of currentToolCalls) {
        const name = tc.function?.name;
        const args = tc.function?.arguments || {};
        const callId = tc.id || `call_${uuidv4().slice(0, 8)}`;
        send({ type: 'tool_call', name, arguments: args, tool_call_id: callId });

        const result = await executeTool(name, args);
        send({ type: 'tool_result', name, result, tool_call_id: callId });
        const toolContent = JSON.stringify(result);
        const toolMsg = { role: 'tool', content: toolContent, tool_call_id: callId };
        toolResults.push(toolMsg);

        // Persist tool result to DB so resumed conversations have complete message sequences
        db.prepare('INSERT INTO messages (id, conversation_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))').run(
          uuidv4(), convId, 'tool', toolContent, JSON.stringify({ tool_call_id: callId, tool_name: name })
        );
      }

      if (currentContent) {
        saveAssistantMessage(db, convId, currentContent, JSON.stringify(currentToolCalls), reasoningLevel);
      }

      // Format tool_calls for the OpenAI API (llama-server):
      // - arguments must be a JSON string, not a parsed object
      // - each tool_call must have type: 'function'
      const formattedToolCalls = currentToolCalls.map(tc => ({
        id: tc.id || `call_${uuidv4().slice(0, 8)}`,
        type: 'function',
        function: {
          name: tc.function?.name,
          arguments: typeof tc.function?.arguments === 'string'
            ? tc.function.arguments
            : JSON.stringify(tc.function?.arguments || {}),
        },
      }));

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: currentContent || null, tool_calls: formattedToolCalls },
        ...toolResults,
      ];

      // Send debug snapshot of messages going to the model for this tool round
      send({ type: 'debug_tool_round', round: round + 1, messages: currentMessages.map(m => ({ role: m.role, content: m.content?.slice(0, 500), tool_calls: m.tool_calls ? m.tool_calls.map(tc => tc.function?.name) : undefined })) });

      const res = await chatCompletion({ model: mainModel, messages: currentMessages, tools, stream: true, options: ollamaOptions, think: thinkParam, extraBody: extraBodyParams });
      let nextContent = '';
      let nextToolCalls = [];

      for await (const chunk of parseStream(res, getBackend())) {
        if (chunk.message?.content) {
          nextContent += chunk.message.content;
          send({ type: 'content', content: chunk.message.content, conversationId: convId });
        }
        if (chunk.message?.tool_calls) {
          nextToolCalls = chunk.message.tool_calls;
        }
        if (chunk.done) {
          // Accumulate stats from this round
          totalStats.prompt_tokens += chunk.prompt_eval_count || 0;
          totalStats.completion_tokens += chunk.eval_count || 0;
          totalStats.total_tokens += (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0);
          totalStats.eval_duration_ms += chunk.eval_duration ? Math.round(chunk.eval_duration / 1e6) : 0;
          totalStats.total_duration_ms += chunk.total_duration ? Math.round(chunk.total_duration / 1e6) : 0;
          if (chunk.eval_count && chunk.eval_duration) {
            const roundTps = Math.round((chunk.eval_count / (chunk.eval_duration / 1e9)) * 10) / 10;
            totalStats._tps_sum += roundTps;
            totalStats._tps_count += 1;
            totalStats.tokens_per_second = Math.round((totalStats._tps_sum / totalStats._tps_count) * 10) / 10;
          }
          break;
        }
      }

      // If no more tool calls, we're done
      if (nextToolCalls.length === 0) {
        saveAssistantMessage(db, convId, nextContent, null, reasoningLevel, totalStats);
        updateConversationTitle(db, convId, nextContent);
        send({ type: 'done', conversationId: convId, tokenStats: totalStats });
        close();
        return;
      }

      // Otherwise, loop again with the new tool calls
      currentToolCalls = nextToolCalls;
      currentContent = nextContent;
    }

    // Hit max rounds — finalize with whatever we have
    send({ type: 'content', content: '\n\n[Reached maximum tool call depth]', conversationId: convId });
    saveAssistantMessage(db, convId, currentContent + '\n\n[Reached maximum tool call depth]', null, reasoningLevel);
    send({ type: 'done', conversationId: convId });
    close();
  } catch (err) {
    streamError(err);
  }
}

function createConversation(db, model, projectId, systemPromptOverride) {
  const id = uuidv4();
  const mainModel = getMainModel(db, model);
  db.prepare('INSERT INTO conversations (id, title, model, project_id, system_prompt_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))').run(id, 'New Chat', mainModel, projectId || null, systemPromptOverride || null);
  return id;
}

function saveUserMessage(db, convId, content, reasoningLevel) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, reasoning_level, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))').run(uuidv4(), convId, 'user', content, reasoningLevel || null);
  db.prepare('UPDATE conversations SET updated_at = datetime(\'now\') WHERE id = ?').run(convId);
}

function saveAssistantMessage(db, convId, content, toolCalls, reasoningLevel, tokenStats) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, tool_calls, reasoning_level, tokens_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(
    uuidv4(), convId, 'assistant', content, toolCalls, reasoningLevel || null,
    tokenStats ? JSON.stringify(tokenStats) : null
  );
}

function getMessageHistory(db, convId) {
  const rows = db.prepare('SELECT role, content, tool_calls FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC LIMIT 50').all(convId);
  return rows.map(row => {
    let content = row.content || '';

    // For tool-role messages, reconstruct the tool result format for the model
    if (row.role === 'tool') {
      const msg = { role: 'tool', content };
      if (row.tool_calls) {
        try {
          const meta = JSON.parse(row.tool_calls);
          if (meta.tool_call_id) msg.tool_call_id = meta.tool_call_id;
        } catch { /* ignore */ }
      }
      return msg;
    }

    // Strip <think>...</think> blocks from assistant history.
    // Qwen docs: "historical model output should only include the final output part"
    // Sending thinking tokens back wastes context and can confuse the model.
    if (row.role === 'assistant') {
      content = content.replace(/<think>[\s\S]*?<\/think>\n?/g, '').trim();
    }
    const msg = { role: row.role, content };
    // Restore tool_calls on assistant messages so the model sees its prior tool usage
    // Normalize to OpenAI format: type='function', arguments as string
    if (row.role === 'assistant' && row.tool_calls) {
      try {
        const parsed = JSON.parse(row.tool_calls);
        msg.tool_calls = Array.isArray(parsed) ? parsed.map(tc => ({
          id: tc.id || 'call_0',
          type: 'function',
          function: {
            name: tc.function?.name,
            arguments: typeof tc.function?.arguments === 'string'
              ? tc.function.arguments
              : JSON.stringify(tc.function?.arguments || {}),
          },
        })) : parsed;
      } catch { /* malformed tool_calls JSON */ }
    }
    return msg;
  });
}

function getActiveClusters(db) {
  return db.prepare('SELECT * FROM clusters WHERE active = 1').all();
}

function updateConversationTitle(db, convId, content) {
  const conv = db.prepare('SELECT title FROM conversations WHERE id = ?').get(convId);
  if (conv?.title === 'New Chat' && content) {
    const title = content.slice(0, 60).replace(/\n/g, ' ').trim();
    db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, convId);
  }
}

export async function PUT(request) {
  try {
    const db = getDb();
    const { messageId, newContent } = await request.json();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!msg) return notFound('Message not found');

    db.prepare('UPDATE messages SET original_content = content, content = ?, edited = 1, version = version + 1 WHERE id = ?').run(newContent, messageId);
    // Delete all subsequent messages. Use rowid to avoid second-precision collisions
    // where multiple messages share the same created_at timestamp.
    db.prepare('DELETE FROM messages WHERE conversation_id = ? AND rowid > (SELECT rowid FROM messages WHERE id = ?)').run(msg.conversation_id, messageId);

    return success();
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const { messageId } = await request.json();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!msg) return notFound('Message not found');

    // Delete this message and all subsequent messages. Use rowid to avoid
    // second-precision collisions where messages share the same created_at.
    db.prepare('DELETE FROM messages WHERE conversation_id = ? AND rowid >= (SELECT rowid FROM messages WHERE id = ?)').run(msg.conversation_id, messageId);

    return success();
  } catch (err) {
    return errorResponse(err.message);
  }
}
