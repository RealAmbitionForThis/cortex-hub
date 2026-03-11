import { success, notFound, withHandler } from '@/lib/api/response';
import { getDb, updateRow } from '@/lib/db';

const ALLOWED_FIELDS = ['title', 'pinned', 'model', 'project_id', 'system_prompt_override'];

export const GET = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id } = await params;

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  if (!conversation) return notFound('Conversation not found');

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(id);

  return success({ conversation, messages });
});

export const PUT = withHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();

  updateRow('conversations', id, body, ALLOWED_FIELDS);

  return success();
});

export const DELETE = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return success();
});
