import { resolveOllamaUrl as getOllamaUrl } from './urls';
import { DEFAULT_MAIN_MODEL } from '@/lib/constants';

export async function chatCompletion({ model, messages, tools, stream = false, options = {}, think }) {
  // keep_alive is a top-level Ollama param, not inside options
  const { keep_alive, ...ollamaOptions } = options;
  const body = { model, messages, stream };
  if (tools?.length) body.tools = tools;
  if (Object.keys(ollamaOptions).length > 0) body.options = ollamaOptions;
  if (keep_alive !== undefined) body.keep_alive = keep_alive;
  // Enable Ollama's native thinking support — returns thinking in message.thinking field
  if (think !== undefined) body.think = think;

  const res = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat error: ${res.status}`);
  }

  return res;
}

export async function generateEmbedding(text, model) {
  const embeddingModel = model || process.env.CORTEX_DEFAULT_EMBEDDING_MODEL || 'nomic-embed-text';

  const res = await fetch(`${getOllamaUrl()}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: embeddingModel, input: text }),
  });

  if (!res.ok) {
    throw new Error(`Embedding error: ${res.status}`);
  }

  const data = await res.json();
  return data.embeddings?.[0] || [];
}

export async function listModels() {
  const res = await fetch(`${getOllamaUrl()}/api/tags`);
  if (!res.ok) throw new Error(`List models error: ${res.status}`);
  const data = await res.json();
  return data.models || [];
}

export async function showModel(modelName) {
  const res = await fetch(`${getOllamaUrl()}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });
  if (!res.ok) throw new Error(`Show model error: ${res.status}`);
  return res.json();
}

export async function checkConnection() {
  try {
    const res = await fetch(`${getOllamaUrl()}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function generateCompletion({ model, prompt, stream = false, images }) {
  const body = { model: model || process.env.CORTEX_DEFAULT_MAIN_MODEL || DEFAULT_MAIN_MODEL, prompt, stream };
  if (images) body.images = images;

  const res = await fetch(`${getOllamaUrl()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Generate error: ${res.status}`);
  if (stream) return res;
  const data = await res.json();
  return data.response;
}
