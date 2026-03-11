import { resolveLlamacppUrl, resolveEmbeddingUrl } from './urls';

function LLAMACPP_URL() {
  return resolveLlamacppUrl();
}

export async function chatCompletion({ model, messages, tools, stream = false, options = {}, think, extraBody = {} }) {
  const body = {
    model: model || 'default',
    messages,
    stream,
  };

  // Map Ollama option keys → llama-server /v1/chat/completions keys.
  // llama-server extends the OpenAI API with its own sampling params (mirostat, top_k, etc.)
  // See: github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md

  // Sampling
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.top_p !== undefined) body.top_p = options.top_p;
  if (options.top_k !== undefined) body.top_k = options.top_k;
  if (options.min_p !== undefined) body.min_p = options.min_p;
  if (options.typical_p !== undefined) body.typical_p = options.typical_p;

  // Generation — num_ctx sets context size (n_ctx in llama-server), num_predict → max_tokens (OpenAI name)
  // llama-server supports n_predict and n_ctx as native params
  if (options.num_ctx) body.n_ctx = options.num_ctx;
  if (options.num_predict !== undefined && options.num_predict >= 0) body.max_tokens = options.num_predict;
  if (options.seed !== undefined && options.seed >= 0) body.seed = options.seed;
  if (options.stop && options.stop.length > 0) body.stop = options.stop;

  // Penalties — llama-server uses the same names as OpenAI + its own repeat_penalty
  if (options.repeat_penalty !== undefined) body.repeat_penalty = options.repeat_penalty;
  if (options.repeat_last_n !== undefined) body.repeat_last_n = options.repeat_last_n;
  if (options.frequency_penalty !== undefined) body.frequency_penalty = options.frequency_penalty;
  if (options.presence_penalty !== undefined) body.presence_penalty = options.presence_penalty;

  // Penalties — additional
  if (options.tfs_z !== undefined) body.tfs_z = options.tfs_z;

  // Advanced — llama-server supports these natively
  if (options.mirostat !== undefined) body.mirostat = options.mirostat;
  if (options.mirostat_tau !== undefined) body.mirostat_tau = options.mirostat_tau;
  if (options.mirostat_eta !== undefined) body.mirostat_eta = options.mirostat_eta;
  if (options.dynatemp_range !== undefined) body.dynatemp_range = options.dynatemp_range;
  if (options.cache_prompt !== undefined) body.cache_prompt = options.cache_prompt;

  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  // llama-server supports thinking natively via reasoning_content in the response.
  // Map think param to reasoning_budget. Accepts booleans or gpt-oss style strings.
  // The server must be launched with --think deepseek (or similar) for this to have effect.
  if (think === true || think === 'high') {
    body.reasoning_budget = -1;
  } else if (think === false || think === 'low') {
    body.reasoning_budget = 0;
  } else if (think === 'medium') {
    body.reasoning_budget = -1;
  }

  // Merge any extra body params (e.g. chat_template_kwargs for Qwen/Kimi thinking)
  Object.assign(body, extraBody);

  const res = await fetch(`${LLAMACPP_URL()}/v1/chat/completions`, {
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

  const res = await fetch(`${LLAMACPP_URL()}/v1/completions`, {
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
    const res = await fetch(`${LLAMACPP_URL()}/v1/embeddings`, {
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

  // Fallback to embedding URL from DB settings or CORTEX_EMBEDDING_URL env var
  const fallbackUrl = resolveEmbeddingUrl();
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
  const res = await fetch(`${LLAMACPP_URL()}/v1/models`);
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
    const res = await fetch(`${LLAMACPP_URL()}/v1/models`);
    return res.ok;
  } catch {
    return false;
  }
}
