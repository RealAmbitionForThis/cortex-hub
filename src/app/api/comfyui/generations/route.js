import { success, error } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT g.*, w.name as workflow_name
      FROM comfyui_generations g
      LEFT JOIN comfyui_workflows w ON g.workflow_id = w.id
      ORDER BY g.created_at DESC
      LIMIT 100
    `).all();

    const generations = rows.map((row) => ({
      ...row,
      input_params: row.input_params ? JSON.parse(row.input_params) : [],
      output_images: row.output_images ? JSON.parse(row.output_images) : [],
    }));

    return success({ generations });
  } catch (err) {
    return error(err.message);
  }
}
