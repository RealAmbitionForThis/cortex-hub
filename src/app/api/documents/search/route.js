import { success, badRequest, withHandler } from '@/lib/api/response';
import { searchDocuments } from '@/lib/docs/rag';

export const POST = withHandler(async (request) => {
  const { query, limit } = await request.json();
  if (!query) return badRequest('Query required');
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 50);
  const results = await searchDocuments(query, safeLimit);
  return success({ results });
});
