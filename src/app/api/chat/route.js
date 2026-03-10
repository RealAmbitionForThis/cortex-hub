import { success, error as errorResponse, notFound } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { chatCompletion } from '@/lib/llm/client';
import { parseOllamaStream, createSSEStream } from '@/lib/llm/streaming';
import { buildSystemPrompt } from '@/lib/llm/prompts';
import { retrieveRelevantMemories } from '@/lib/memory/retrieval';
import { getToolDefinitions, executeTool } from '@/lib/tools/registry';

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, message, model, reasoningLevel, attachments, enabledTools, temperature, contextWindow, projectId, systemPromptOverride } = body;
    const db = getDb();

    const convId = conversationId || await createConversation(db, model, projectId, systemPromptOverride);
    saveUserMessage(db, convId, message, reasoningLevel);

    const memories = await retrieveRelevantMemories({ query: message });
    const activeClusters = getActiveClusters(db);

    let tools = getToolDefinitions();

    // Filter tools based on enabled toggles
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
    });

    const history = getMessageHistory(db, convId);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];
    // Read default model from settings, fall back to env var
    let mainModel = model;
    if (!mainModel) {
      const setting = db.prepare("SELECT value FROM settings WHERE key = 'main_model'").get();
      mainModel = setting ? JSON.parse(setting.value) : (process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b');
    }

    const { stream, send, close, error: streamError } = createSSEStream();

    const ollamaOptions = {};
    if (temperature !== undefined) ollamaOptions.temperature = temperature;
    if (contextWindow) ollamaOptions.num_ctx = contextWindow;

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
    const res = await chatCompletion({ model: mainModel, messages, tools, stream: true, options: ollamaOptions });
    let fullContent = '';
    let toolCalls = [];
    let tokenStats = null;

    for await (const chunk of parseOllamaStream(res)) {
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
      await handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel, ollamaOptions, tools, tokenStats });
      return;
    }

    saveAssistantMessage(db, convId, fullContent, null, reasoningLevel, tokenStats);
    updateConversationTitle(db, convId, fullContent);
    send({ type: 'done', conversationId: convId, tokenStats });
    close();
  } catch (err) {
    streamError(err);
  }
}

async function handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel, ollamaOptions, tools, tokenStats: initialStats }) {
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
        toolResults.push({ role: 'tool', content: JSON.stringify(result) });
      }

      if (currentContent) {
        saveAssistantMessage(db, convId, currentContent, JSON.stringify(currentToolCalls), reasoningLevel);
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: currentContent, tool_calls: currentToolCalls },
        ...toolResults,
      ];

      const res = await chatCompletion({ model: mainModel, messages: currentMessages, tools, stream: true, options: ollamaOptions });
      let nextContent = '';
      let nextToolCalls = [];

      for await (const chunk of parseOllamaStream(res)) {
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
  let mainModel = model;
  if (!mainModel) {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'main_model'").get();
    mainModel = setting ? JSON.parse(setting.value) : (process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b');
  }
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
  return db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 50').all(convId);
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
