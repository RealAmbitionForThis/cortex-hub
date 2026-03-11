import { success, withHandler } from '@/lib/api/response';
import { listModels, showModel } from '@/lib/llm/provider';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  // If a specific model name is provided, show its details
  if (name) {
    const info = await showModel(name);
    const template = (info.template || '').toLowerCase();
    const modelfile = (info.modelfile || '').toLowerCase();

    const nameLower = (info.name || name || '').toLowerCase();

    const hasThinkingTemplate =
      template.includes('<think') ||
      template.includes('</think') ||
      template.includes('<reasoning') ||
      template.includes('think_') ||
      modelfile.includes('think');

    const hasThinkingName =
      nameLower.includes('qwq') ||
      nameLower.includes('qwen3') ||
      nameLower.includes('deepseek-r1') ||
      nameLower.includes('deepseek-reasoner') ||
      nameLower.includes('gpt-oss') ||
      nameLower.includes('gpt_oss') ||
      nameLower.includes('kimi') ||
      nameLower.includes('command-r') ||
      nameLower.includes('smollm3') ||
      nameLower.includes('think');

    const supportsThinking = hasThinkingTemplate || hasThinkingName;

    return success({
      name: info.name || name,
      details: info.details,
      supportsThinking,
      template: info.template,
    });
  }

  // Otherwise list all models
  try {
    const models = await listModels();
    return success({ models });
  } catch {
    // Server not ready yet (503) or unreachable — return empty instead of 500
    return success({ models: [] });
  }
});
