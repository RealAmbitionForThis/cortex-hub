import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const GET = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id } = await params;
  const docs = db.prepare(`
    SELECT d.* FROM documents d
    JOIN project_documents pd ON pd.document_id = d.id
    WHERE pd.project_id = ?
    ORDER BY pd.created_at DESC
  `).all(id);
  return success({ documents: docs });
});

export const POST = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id: projectId } = await params;
  const body = await request.json();
  const { document_id } = body;
  if (!document_id) return badRequest('document_id required');

  db.prepare(
    'INSERT OR IGNORE INTO project_documents (id, project_id, document_id) VALUES (?, ?, ?)'
  ).run(uuidv4(), projectId, document_id);

  return success();
});

export const DELETE = withHandler(async (request, { params }) => {
  const db = getDb();
  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('document_id');
  if (!documentId) return badRequest('document_id required');

  db.prepare(
    'DELETE FROM project_documents WHERE project_id = ? AND document_id = ?'
  ).run(projectId, documentId);

  return success();
});
