import { success, error, badRequest } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const projects = db.prepare(`
      SELECT p.*, (SELECT COUNT(*) FROM conversations c WHERE c.project_id = p.id) as conversation_count
      FROM projects p ORDER BY p.updated_at DESC
    `).all();
    return success({ projects });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name) return badRequest('Project name required');

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO projects (id, name, system_prompt, icon, color) VALUES (?, ?, ?, ?, ?)'
    ).run(id, body.name, body.system_prompt || '', body.icon || '\u{1F4C2}', body.color || '#6366f1');

    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.id) return badRequest('Project ID required');

    const db = getDb();
    const allowed = ['name', 'system_prompt', 'icon', 'color'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${key} = ?`);
        vals.push(body[key]);
      }
    }
    if (sets.length === 0) return badRequest('No fields to update');

    sets.push("updated_at = datetime('now')");
    vals.push(body.id);
    db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('Project ID required');

    const db = getDb();
    db.prepare('UPDATE conversations SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    return success();
  } catch (err) {
    return error(err.message);
  }
}
