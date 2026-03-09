import { success, error, notFound } from '@/lib/api/response';
import { getDb } from '@/lib/db';

const ALLOWED_FIELDS = ['title', 'pinned', 'model'];

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

    const sets = [];
    const values = [];

    for (const [key, val] of Object.entries(body)) {
      if (ALLOWED_FIELDS.includes(key)) {
        sets.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (sets.length > 0) {
      sets.push('updated_at = datetime(\'now\')');
      values.push(id);
      db.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }

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
