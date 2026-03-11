import { success, error } from '@/lib/api/response';
import { resolveOllamaUrl } from '@/lib/llm/urls';

export async function GET() {
  try {
    const res = await fetch(`${resolveOllamaUrl()}/api/ps`, { cache: 'no-store' });
    if (!res.ok) {
      return error(`Ollama returned ${res.status}`, res.status);
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      size_vram: m.size_vram,
      expires_at: m.expires_at,
      digest: m.digest,
    }));
    return success({ models });
  } catch (err) {
    return error(err.message);
  }
}
