import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { textToVector, vectorToBuffer } from '@/lib/memory/embeddings';
import { retrieveRelevantMemories } from '@/lib/memory/retrieval';

export const memoryTools = [
  {
    name: 'memory.search',
    description: 'Search through memories using semantic similarity',
    parameters: { type: 'object', properties: { query: { type: 'string' }, module: { type: 'string' } }, required: ['query'] },
    handler: handleSearch,
  },
  {
    name: 'memory.add',
    description: 'Add a new persistent memory',
    parameters: { type: 'object', properties: { content: { type: 'string' }, category: { type: 'string' }, module: { type: 'string' } }, required: ['content', 'category'] },
    handler: handleAdd,
  },
  {
    name: 'memory.add_static',
    description: 'Add a protected static memory that will never be auto-overwritten',
    parameters: { type: 'object', properties: { content: { type: 'string' }, category: { type: 'string' }, module: { type: 'string' } }, required: ['content'] },
    handler: handleAddStatic,
  },
  {
    name: 'memory.forget',
    description: 'Delete a specific memory',
    parameters: { type: 'object', properties: { memory_id: { type: 'string' } }, required: ['memory_id'] },
    handler: handleForget,
  },
  {
    name: 'memory.list',
    description: 'List memories with optional filters',
    parameters: { type: 'object', properties: { memory_type: { type: 'string' }, module: { type: 'string' }, limit: { type: 'number' } } },
    handler: handleList,
  },
  {
    name: 'memory.get_daily_log',
    description: 'Get the daily conversation summary for a specific date',
    parameters: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] },
    handler: handleGetDailyLog,
  },
  {
    name: 'memory.search_daily_logs',
    description: 'Search through daily conversation logs',
    parameters: { type: 'object', properties: { query: { type: 'string' }, date_from: { type: 'string' }, date_to: { type: 'string' } }, required: ['query'] },
    handler: handleSearchDailyLogs,
  },
];

async function handleSearch({ query, module }) {
  const results = await retrieveRelevantMemories({ query, module, limit: 10 });
  return { memories: results.map(formatMemory) };
}

async function handleAdd({ content, category, module }) {
  const db = getDb();
  const embedding = await textToVector(content);
  const id = uuidv4();
  db.prepare('INSERT INTO memories (id, memory_type, category, module, content, embedding, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))').run(id, 'persistent', category || 'fact', module || 'general', content, embedding ? vectorToBuffer(embedding) : null);
  return { success: true, id };
}

async function handleAddStatic({ content, category, module }) {
  const db = getDb();
  const embedding = await textToVector(content);
  const id = uuidv4();
  db.prepare('INSERT INTO memories (id, memory_type, category, module, content, embedding, protected, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime(\'now\'), datetime(\'now\'))').run(id, 'static', category || 'fact', module || 'general', content, embedding ? vectorToBuffer(embedding) : null);
  return { success: true, id };
}

function handleForget({ memory_id }) {
  const db = getDb();
  // Check if memory exists and if it's protected
  const existing = db.prepare('SELECT id, protected FROM memories WHERE id = ?').get(memory_id);
  if (!existing) {
    return { success: false, error: 'Memory not found' };
  }
  if (existing.protected) {
    return { success: false, error: 'Cannot delete a protected (static) memory. Use the Memories page to remove it manually.' };
  }
  db.prepare('DELETE FROM memories WHERE id = ?').run(memory_id);
  return { success: true };
}

function handleList({ memory_type, module, limit }) {
  const db = getDb();
  let query = 'SELECT * FROM memories WHERE 1=1';
  const params = [];
  if (memory_type) { query += ' AND memory_type = ?'; params.push(memory_type); }
  if (module) { query += ' AND module = ?'; params.push(module); }
  query += ' ORDER BY updated_at DESC LIMIT ?';
  params.push(limit || 50);
  const rows = db.prepare(query).all(...params);
  return { memories: rows.map(formatMemory) };
}

function handleGetDailyLog({ date }) {
  const db = getDb();
  const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(date);
  return log || { message: 'No daily log found for this date' };
}

function handleSearchDailyLogs({ query, date_from, date_to }) {
  const db = getDb();
  let sql = 'SELECT * FROM daily_logs WHERE summary LIKE ?';
  const params = [`%${query}%`];
  if (date_from) { sql += ' AND date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND date <= ?'; params.push(date_to); }
  sql += ' ORDER BY date DESC LIMIT 20';
  return { logs: db.prepare(sql).all(...params) };
}

function formatMemory(m) {
  return { id: m.id, content: m.content, category: m.category, module: m.module, memory_type: m.memory_type, confidence: m.confidence, protected: m.protected, created_at: m.created_at };
}
