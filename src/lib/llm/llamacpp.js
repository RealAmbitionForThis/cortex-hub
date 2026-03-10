const LLAMACPP_URL = process.env.LLAMACPP_URL || 'http://localhost:8080';

export async function chatCompletion({ model, messages, tools, stream = false, options = {}, think }) {
  const body = {
    model: model || 'default',
    messages,
    stream,
  };

  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.num_ctx) body.max_tokens = options.num_ctx;
  if (options.top_p !== undefined) body.top_p = options.top_p;
  if (options.stop) body.stop = options.stop;
  if (options.frequency_penalty !== undefined) body.frequency_penalty = options.frequency_penalty;
  if (options.presence_penalty !== undefined) body.presence_penalty = options.presence_penalty;

  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  // llama-server doesn't have a native think parameter — include reasoning instruction if needed
  // The system prompt already handles reasoning level, so this is a no-op for llama.cpp

  const res = await fetch(`${LLAMACPP_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`llama.cpp chat error: ${res.status}`);
  }

  return res;
}

export async function generateCompletion({ model, prompt, stream = false, images }) {
  if (images) {
    console.warn('[llama.cpp] Image input is not supported for generateCompletion, ignoring images');
  }

  const body = {
    model: model || process.env.CORTEX_DEFAULT_MAIN_MODEL || 'default',
    prompt,
    stream,
  };

  const res = await fetch(`${LLAMACPP_URL}/v1/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`llama.cpp generate error: ${res.status}`);
  if (stream) return res;
  const data = await res.json();
  return data.choices?.[0]?.text || '';
}

export async function generateEmbedding(text, model) {
  const embeddingModel = model || process.env.CORTEX_DEFAULT_EMBEDDING_MODEL || 'default';

  // Try llama-server /v1/embeddings first (requires --embedding flag)
  try {
    const res = await fetch(`${LLAMACPP_URL}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: embeddingModel, input: text }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.data?.[0]?.embedding || [];
    }
  } catch {
    // llama-server embeddings not available, try fallback
  }

  // Fallback to CORTEX_EMBEDDING_URL if configured
  const fallbackUrl = process.env.CORTEX_EMBEDDING_URL;
  if (fallbackUrl) {
    const res = await fetch(`${fallbackUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: embeddingModel, input: text }),
    });

    if (!res.ok) {
      throw new Error(`Embedding fallback error: ${res.status}`);
    }

    const data = await res.json();
    return data.data?.[0]?.embedding || [];
  }

  console.warn('[llama.cpp] No embedding endpoint available. Memory extraction will be disabled. Start llama-server with --embedding or set CORTEX_EMBEDDING_URL.');
  throw new Error('No embedding endpoint available');
}

export async function listModels() {
  const res = await fetch(`${LLAMACPP_URL}/v1/models`);
  if (!res.ok) throw new Error(`llama.cpp list models error: ${res.status}`);
  const data = await res.json();
  return (data.data || []).map((m) => ({
    name: m.id,
    size: 0,
    modified_at: null,
    details: {},
  }));
}

export async function showModel(modelName) {
  // llama-server has no model detail endpoint — return stub with all fields
  // that models/route.js accesses so optional-chaining and || '' checks work
  return { name: modelName, details: {}, template: '', modelfile: '', parameters: {} };
}

export async function checkConnection() {
  try {
    const res = await fetch(`${LLAMACPP_URL}/v1/models`);
    return res.ok;
  } catch {
    return false;
  }
}
