import { success } from '@/lib/api/response';
import { checkConnection, listModels } from '@/lib/llm/provider';

export async function GET() {
  try {
    const connected = await checkConnection();
    if (!connected) {
      return success({ connected: false, models: [] });
    }
    const models = await listModels();
    return success({ connected: true, models });
  } catch {
    return success({ connected: false, models: [] });
  }
}
