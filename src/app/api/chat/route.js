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
    const { conversationId, message, model, reasoningLevel, attachments } = body;
    const db = getDb();

    const convId = conversationId || await createConversation(db, model);
    saveUserMessage(db, convId, message, reasoningLevel);

    const memories = await retrieveRelevantMemories({ query: message });
    const activeClusters = getActiveClusters(db);
    const systemPrompt = buildSystemPrompt({
      reasoningLevel: reasoningLevel || 'medium',
      memories,
      clusters: activeClusters,
      tools: getToolDefinitions(),
    });

    const history = getMessageHistory(db, convId);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const tools = getToolDefinitions();
    const mainModel = model || process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b';

    const { stream, send, close, error: streamError } = createSSEStream();

    streamChat({ db, convId, mainModel, messages, tools, send, close, streamError, reasoningLevel });

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

async function streamChat({ db, convId, mainModel, messages, tools, send, close, streamError, reasoningLevel }) {
  try {
    const res = await chatCompletion({ model: mainModel, messages, tools, stream: true });
    let fullContent = '';
    let toolCalls = [];

    for await (const chunk of parseOllamaStream(res)) {
      if (chunk.message?.content) {
        fullContent += chunk.message.content;
        send({ type: 'content', content: chunk.message.content, conversationId: convId });
      }
      if (chunk.message?.tool_calls) {
        toolCalls = chunk.message.tool_calls;
      }
      if (chunk.done) break;
    }

    if (toolCalls.length > 0) {
      await handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel });
      return;
    }

    saveAssistantMessage(db, convId, fullContent, null, reasoningLevel);
    updateConversationTitle(db, convId, fullContent);
    send({ type: 'done', conversationId: convId });
    close();
  } catch (err) {
    streamError(err);
  }
}

async function handleToolCalls({ db, convId, mainModel, messages, toolCalls, fullContent, send, close, streamError, reasoningLevel }) {
  try {
    const toolResults = [];

    for (const tc of toolCalls) {
      const name = tc.function?.name;
      const args = tc.function?.arguments || {};
      send({ type: 'tool_call', name, arguments: args });

      const result = await executeTool(name, args);
      send({ type: 'tool_result', name, result });
      toolResults.push({ role: 'tool', content: JSON.stringify(result) });
    }

    if (fullContent) {
      saveAssistantMessage(db, convId, fullContent, JSON.stringify(toolCalls), reasoningLevel);
    }

    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: fullContent, tool_calls: toolCalls },
      ...toolResults,
    ];

    const res = await chatCompletion({ model: mainModel, messages: updatedMessages, stream: true });
    let finalContent = '';

    for await (const chunk of parseOllamaStream(res)) {
      if (chunk.message?.content) {
        finalContent += chunk.message.content;
        send({ type: 'content', content: chunk.message.content, conversationId: convId });
      }
      if (chunk.done) break;
    }

    saveAssistantMessage(db, convId, finalContent, null, reasoningLevel);
    updateConversationTitle(db, convId, finalContent);
    send({ type: 'done', conversationId: convId });
    close();
  } catch (err) {
    streamError(err);
  }
}

function createConversation(db, model) {
  const id = uuidv4();
  const mainModel = model || process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b';
  db.prepare('INSERT INTO conversations (id, title, model, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))').run(id, 'New Chat', mainModel);
  return id;
}

function saveUserMessage(db, convId, content, reasoningLevel) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, reasoning_level, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))').run(uuidv4(), convId, 'user', content, reasoningLevel || null);
  db.prepare('UPDATE conversations SET updated_at = datetime(\'now\') WHERE id = ?').run(convId);
}

function saveAssistantMessage(db, convId, content, toolCalls, reasoningLevel) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, tool_calls, reasoning_level, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(uuidv4(), convId, 'assistant', content, toolCalls, reasoningLevel || null);
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
