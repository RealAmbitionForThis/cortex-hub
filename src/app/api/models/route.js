import { success, error } from '@/lib/api/response';
import { listModels, showModel } from '@/lib/llm/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // If a specific model name is provided, show its details
    if (name) {
      const info = await showModel(name);
      // Check if model supports thinking/reasoning by examining:
      // 1. Template containing <think> or <reasoning> tags
      // 2. Model family/architecture hints
      // 3. Modelfile parameters
      const template = (info.template || '').toLowerCase();
      const modelfile = (info.modelfile || '').toLowerCase();
      const parameters = info.parameters || {};

      const supportsThinking =
        template.includes('<think') ||
        template.includes('</think') ||
        template.includes('<reasoning') ||
        template.includes('think_') ||
        modelfile.includes('think') ||
        modelfile.includes('reason') ||
        (info.details?.family || '').toLowerCase().includes('deepseek') ||
        (info.details?.family || '').toLowerCase().includes('qwen');

      return success({
        name: info.name || name,
        details: info.details,
        supportsThinking,
        template: info.template,
      });
    }

    // Otherwise list all models
    const models = await listModels();
    return success({ models });
  } catch (err) {
    return error(err.message);
  }
}
