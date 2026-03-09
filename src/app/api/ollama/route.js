import { success } from '@/lib/api/response';
import { getOllamaStatus } from '@/lib/llm/models';

export async function GET() {
  try {
    const status = await getOllamaStatus();
    return success(status);
  } catch {
    return success({ connected: false, models: [] });
  }
}
