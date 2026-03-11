import { success } from '@/lib/api/response';
import { checkConnection, listModels, getBackend, resolveLlamacppUrl } from '@/lib/llm/provider';

export async function GET() {
  try {
    const connected = await checkConnection();
    if (!connected) {
      return success({ connected: false, models: [] });
    }
    const models = await listModels();
    const result = { connected: true, models };

    // For llama-server, query /props to get the active chat template
    // This helps the frontend detect model family for thinking config
    const backend = getBackend();
    if (backend === 'llamacpp') {
      try {
        const propsRes = await fetch(`${resolveLlamacppUrl()}/props`);
        if (propsRes.ok) {
          const props = await propsRes.json();
          result.serverProps = {
            chatTemplate: props.chat_template || null,
            defaultGeneration: props.default_generation_settings || null,
          };
        }
      } catch { /* /props not available */ }
    }

    return success(result);
  } catch {
    return success({ connected: false, models: [] });
  }
}
