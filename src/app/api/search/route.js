import { success, error, badRequest } from '@/lib/api/response';
import { searchWeb, fetchAndSummarize } from '@/lib/search/web';

export async function POST(request) {
  try {
    const { query, url, max_results } = await request.json();

    if (url) {
      const result = await fetchAndSummarize(url);
      return success(result);
    }

    if (!query) return badRequest('Query required');
    const safeLimit = Math.min(Math.max(parseInt(max_results, 10) || 5, 1), 20);
    const results = await searchWeb(query, safeLimit);
    return success({ results });
  } catch (err) {
    return error(err.message);
  }
}
