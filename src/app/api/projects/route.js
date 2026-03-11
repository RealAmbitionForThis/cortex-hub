import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb, updateRow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ACCENT_COLOR } from '@/lib/constants';

export const GET = withHandler(async () => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM conversations c WHERE c.project_id = p.id) as conversation_count
    FROM projects p ORDER BY p.updated_at DESC
  `).all();
  return success({ projects });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (!body.name) return badRequest('Project name required');

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    'INSERT INTO projects (id, name, system_prompt, icon, color) VALUES (?, ?, ?, ?, ?)'
  ).run(id, body.name, body.system_prompt || '', body.icon || '\u{1F4C2}', body.color || DEFAULT_ACCENT_COLOR);

  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Project ID required');

  const updated = updateRow('projects', body.id, body, ['name', 'system_prompt', 'icon', 'color']);
  if (!updated) return badRequest('No fields to update');

  return success();
});

export const DELETE = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('Project ID required');

  const db = getDb();
  db.prepare('UPDATE conversations SET project_id = NULL WHERE project_id = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);

  return success();
});
