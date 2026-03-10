import { success, error, notFound } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { parseWorkflow } from '@/lib/comfyui/parse';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare('SELECT * FROM comfyui_workflows WHERE id = ?').get(id);
    if (!row) return notFound('Workflow not found');
    return success({ workflow: parseWorkflow(row) });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT id FROM comfyui_workflows WHERE id = ?').get(id);
    if (!existing) return notFound('Workflow not found');

    const fields = [];
    const values = [];

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.parameters !== undefined) { fields.push('parameters = ?'); values.push(JSON.stringify(body.parameters)); }
    if (body.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(body.tags)); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE comfyui_workflows SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM comfyui_workflows WHERE id = ?').run(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
