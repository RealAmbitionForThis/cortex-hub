const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export async function chatCompletion({ model, messages, tools, stream = false }) {
  const body = { model, messages, stream };
  if (tools?.length) body.tools = tools;

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
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

  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
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
  const res = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!res.ok) throw new Error(`List models error: ${res.status}`);
  const data = await res.json();
  return data.models || [];
}

export async function checkConnection() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function generateCompletion({ model, prompt, stream = false }) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream }),
  });

  if (!res.ok) throw new Error(`Generate error: ${res.status}`);
  return res;
}
