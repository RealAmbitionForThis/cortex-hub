import { success, error, notFound } from '@/lib/api/response';
import { getDb, updateRow } from '@/lib/db';

const ALLOWED_FIELDS = ['title', 'pinned', 'model', 'project_id', 'system_prompt_override'];

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    if (!conversation) return notFound('Conversation not found');

    const messages = db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(id);

    return success({ conversation, messages });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    updateRow('conversations', id, body, ALLOWED_FIELDS);

    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
