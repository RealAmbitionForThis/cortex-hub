import { success, notFound, withHandler } from '@/lib/api/response';
import { getDb, updateRow } from '@/lib/db';
import { parseWorkflow } from '@/lib/comfyui/parse';

export const GET = withHandler(async (request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare('SELECT * FROM comfyui_workflows WHERE id = ?').get(id);
  if (!row) return notFound('Workflow not found');
  return success({ workflow: parseWorkflow(row) });
});

export const PUT = withHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const existing = db.prepare('SELECT id FROM comfyui_workflows WHERE id = ?').get(id);
  if (!existing) return notFound('Workflow not found');

  updateRow('comfyui_workflows', id, body, ['name', 'description', 'parameters', 'tags'], {
    serialize: ['parameters', 'tags'],
  });

  return success();
});

export const DELETE = withHandler(async (request, { params }) => {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM comfyui_workflows WHERE id = ?').run(id);
  return success();
});
