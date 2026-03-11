import { success, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { parseJsonSafe } from '@/lib/utils/format';

export const GET = withHandler(async () => {
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
    input_params: parseJsonSafe(row.input_params, []),
    output_images: parseJsonSafe(row.output_images, []),
  }));

  return success({ generations });
});
