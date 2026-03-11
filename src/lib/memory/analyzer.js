import { getDb } from '@/lib/db';
import { chatCompletion } from '@/lib/llm/provider';
import { textToVector, vectorToBuffer } from './embeddings';
import { findSimilarMemory, shouldUpdate } from './dedup';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MAIN_MODEL } from '@/lib/constants';
import { parseJsonSafe } from '@/lib/utils/format';

const ANALYSIS_PROMPT = `Analyze the following conversation messages and extract structured information.

Messages:
{messages}

Extract the following as JSON:
{
  "facts": ["string array of factual statements about the user"],
  "preferences": ["things the user likes or prefers"],
  "events": ["things that happened"],
  "reminders": ["things to remember or follow up on"],
  "updates": ["corrections to previously known information"],
  "mood": "overall mood/sentiment"
}

Only extract genuinely useful information. Skip greetings, filler, and generic statements.
Return ONLY valid JSON, nothing else.`;

export async function analyzeRecentConversations() {
  const db = getDb();
  const lastHour = new Date(Date.now() - 3600000).toISOString();
  const messages = db.prepare(
    'SELECT m.id, m.role, m.content FROM messages m WHERE m.created_at >= ? ORDER BY m.created_at'
  ).all(lastHour);
  if (messages.length < 2) return;
  await analyzeMessages(messages);
}

export async function analyzeMessages(messages, model) {
  if (!messages.length) return;

  const messageText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = ANALYSIS_PROMPT.replace('{messages}', messageText);
  const mainModel = model || process.env.CORTEX_DEFAULT_MAIN_MODEL || DEFAULT_MAIN_MODEL;

  try {
    const res = await chatCompletion({
      model: mainModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    const data = await res.json();
    // Ollama: { message: { content } }, llama-server: { choices: [{ message: { content } }] }
    const content = data.message?.content || data.choices?.[0]?.message?.content || '';
    const extracted = parseJsonSafe(content);

    if (extracted) {
      await processExtracted(extracted, messages[0]?.id);
    }
  } catch (e) {
    console.error('[memory/analyzer] Analysis failed:', e.message);
  }
}

async function processExtracted(extracted, sourceMessageId) {
  const categoryMap = {
    facts: 'fact',
    preferences: 'preference',
    events: 'event',
    reminders: 'reminder',
  };

  for (const [key, category] of Object.entries(categoryMap)) {
    const items = extracted[key] || [];
    for (const item of items) {
      await storeMemory(item, category, sourceMessageId);
    }
  }
}

async function storeMemory(content, category, sourceMessageId) {
  const db = getDb();
  const embedding = await textToVector(content);

  if (embedding) {
    const similar = findSimilarMemory(embedding);
    if (similar && shouldUpdate(similar.memory, content)) {
      db.prepare('UPDATE memories SET content = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(content, similar.memory.id);
      return;
    }
    if (similar) return; // Already exists, no update needed
  }

  db.prepare(
    'INSERT INTO memories (id, memory_type, category, module, content, embedding, source_message_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
  ).run(
    uuidv4(), 'persistent', category, 'general', content,
    embedding ? vectorToBuffer(embedding) : null,
    sourceMessageId
  );
}
