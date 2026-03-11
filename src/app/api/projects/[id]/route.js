import { success, notFound, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export const GET = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id } = await params;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return notFound('Project not found');

  const conversations = db.prepare(
    'SELECT id, title, model, updated_at FROM conversations WHERE project_id = ? ORDER BY updated_at DESC'
  ).all(id);

  const documents = db.prepare(`
    SELECT d.* FROM documents d
    JOIN project_documents pd ON pd.document_id = d.id
    WHERE pd.project_id = ?
    ORDER BY pd.created_at DESC
  `).all(id);

  return success({ project, conversations, documents });
});
