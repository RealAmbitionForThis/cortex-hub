import { success, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MAIN_MODEL } from '@/lib/constants';

export const GET = withHandler(async () => {
  const db = getDb();
  const conversations = db.prepare(
    'SELECT * FROM conversations ORDER BY pinned DESC, updated_at DESC LIMIT 100'
  ).all();
  return success({ conversations });
});

export const POST = withHandler(async (request) => {
  const db = getDb();
  const body = await request.json();
  const id = uuidv4();
  const model = body.model || process.env.CORTEX_DEFAULT_MAIN_MODEL || DEFAULT_MAIN_MODEL;

  db.prepare(
    'INSERT INTO conversations (id, title, model, cluster_id, reasoning_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
  ).run(id, body.title || 'New Chat', model, body.cluster_id || null, body.reasoning_level || 'medium');

  return success({ id });
});

export const DELETE = withHandler(async (request) => {
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return success();
});
