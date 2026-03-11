import { success, error as errorResponse, notFound } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { chatCompletion, getBackend } from '@/lib/llm/provider';
import { parseStream, createSSEStream } from '@/lib/llm/streaming';
import { buildSystemPrompt } from '@/lib/llm/prompts';
import { retrieveRelevantMemories } from '@/lib/memory/retrieval';
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

    // --- Pre-Analysis Pass (when extra_analyze is enabled) ---
    let enrichedContext = null;
    let analysisResult = null;

    if (extraAnalyze) {
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

        // Non-streaming analysis call with low reasoning + timeout
        const analysisResponse = await Promise.race([
          chatCompletion({
            model: analysisModel,
            messages: analysisMessages,
            stream: false,
            options: { temperature: 0.1 },
            think: false,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), analysisTimeoutMs)),
        ]);

        // Parse the non-streaming response — format differs between Ollama and llama-server
        let rawAnalysisText = '';
        if (analysisResponse && typeof analysisResponse.json === 'function') {
          const jsonData = await analysisResponse.json();
          // Ollama returns { message: { content } }, llama-server returns { choices: [{ message: { content } }] }
          rawAnalysisText = jsonData?.message?.content
            ?? jsonData?.choices?.[0]?.message?.content
            ?? '';
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
          };
        }
      } catch (err) {
        console.error('[analysis] Pre-analysis failed, falling back to standard flow:', err?.message ?? err);
        // Fall through — enrichedContext stays null, standard flow continues
      }
    }

    // --- Standard flow (with or without enriched context) ---
    let memories;
    let tools;

    if (enrichedContext) {
      // Use enriched memories and filtered tools from analysis
      memories = enrichedContext.memories;
      tools = enrichedContext.filteredTools;
    } else {
      // Standard: retrieve all memories (including active cluster memories) and all tools
      const activeClusterIds = activeClusters.map(c => c.id);
      memories = await retrieveRelevantMemories({ query: message, clusterIds: activeClusterIds });
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

    const { stream, send, close, error: streamError } = createSSEStream();

    // samplingParams is already in Ollama option key format (temperature, top_p, num_ctx, etc.)
    // built by buildOllamaOptions() on the frontend — pass through as-is
    const ollamaOptions = samplingParams && typeof samplingParams === 'object' ? { ...samplingParams } : {};

    // Send analysis result to frontend BEFORE main response begins
    if (analysisResult) {
      send({ type: 'analysis_result', data: analysisResult });
    }

    // Send debug info so the frontend can show exact inputs
    send({ type: 'debug', systemPrompt, messagesCount: messages.length, projectPrompt: projectPrompt || null, model: mainModel });

    streamChat({ db, convId, mainModel, messages, tools, send, close, streamError, reasoningLevel, ollamaOptions });

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
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const toolResults = [];

      for (const tc of currentToolCalls) {
        const name = tc.function?.name;
        const args = tc.function?.arguments || {};
        send({ type: 'tool_call', name, arguments: args });

        const result = await executeTool(name, args);
        send({ type: 'tool_result', name, result });
        const toolMsg = { role: 'tool', content: JSON.stringify(result) };
        // Include tool_call_id if the model provided one, so the model can associate results with calls
        if (tc.id) toolMsg.tool_call_id = tc.id;
        toolResults.push(toolMsg);
      }

      if (currentContent) {
        saveAssistantMessage(db, convId, currentContent, JSON.stringify(currentToolCalls), reasoningLevel);
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: currentContent, tool_calls: currentToolCalls },
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
            totalStats.tokens_per_second = Math.round((chunk.eval_count / (chunk.eval_duration / 1e9)) * 10) / 10;
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
  const rows = db.prepare('SELECT role, content, tool_calls FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 50').all(convId);
  return rows.map(row => {
    let content = row.content || '';
    // Strip <think>...</think> blocks from assistant history.
    // Qwen docs: "historical model output should only include the final output part"
    // Sending thinking tokens back wastes context and can confuse the model.
    if (row.role === 'assistant') {
      content = content.replace(/<think>[\s\S]*?<\/think>\n?/g, '').trim();
    }
    const msg = { role: row.role, content };
    // Restore tool_calls on assistant messages so the model sees its prior tool usage
    if (row.tool_calls) {
      try {
        msg.tool_calls = JSON.parse(row.tool_calls);
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
    db.prepare('DELETE FROM messages WHERE conversation_id = ? AND created_at > ?').run(msg.conversation_id, msg.created_at);

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

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    db.prepare('DELETE FROM messages WHERE conversation_id = ? AND created_at > ?').run(msg.conversation_id, msg.created_at);

    return success();
  } catch (err) {
    return errorResponse(err.message);
  }
}
