export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function send(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }

  function close() {
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    controller.close();
  }

  function error(err) {
    send({ error: err.message || 'Unknown error' });
    close();
  }

  return { stream, send, close, error };
}

// Parses OpenAI-compatible SSE stream (used by llama-server) and normalizes
// chunks to the same shape as parseOllamaStream for the chat route.
// llama-server returns thinking/reasoning in delta.reasoning_content for
// models that produce <think> blocks. We map this to message.thinking
// so the chat route handles it the same way as Ollama's think parameter.
// OpenAI API also doesn't provide eval_duration/total_duration timing fields —
// the chat route falls back to 0 for these via || 0 checks.
export async function* parseOpenAIStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  // Accumulate tool call deltas by index
  const toolCallAccum = [];
  let usage = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() || '';

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') {
        // Yield final chunk with accumulated tool calls
        const finalChunk = { done: true };
        if (toolCallAccum.length > 0) {
          finalChunk.message = {
            tool_calls: toolCallAccum.map((tc) => ({
              id: tc.id,
              function: {
                name: tc.name,
                arguments: safeParseJSON(tc.arguments),
              },
            })),
          };
        }
        if (usage) {
          finalChunk.prompt_eval_count = usage.prompt_tokens || 0;
          finalChunk.eval_count = usage.completion_tokens || 0;
        }
        yield finalChunk;
        return;
      }

      try {
        const parsed = JSON.parse(payload);
        if (parsed.usage) usage = parsed.usage;

        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        const chunk = { message: {} };

        if (delta.content) {
          chunk.message.content = delta.content;
        }

        // llama-server returns thinking in reasoning_content field
        // Map to message.thinking for consistent handling with Ollama
        if (delta.reasoning_content) {
          chunk.message.thinking = delta.reasoning_content;
        }

        // Accumulate streamed tool call deltas
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? toolCallAccum.length;
            if (!toolCallAccum[idx]) {
              toolCallAccum[idx] = { id: tc.id || '', name: '', arguments: '' };
            }
            if (tc.function?.name) toolCallAccum[idx].name = tc.function.name;
            if (tc.function?.arguments) toolCallAccum[idx].arguments += tc.function.arguments;
            if (tc.id) toolCallAccum[idx].id = tc.id;
          }
        }

        if (delta.content || delta.reasoning_content) {
          yield chunk;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  // If stream ended without [DONE], yield final chunk
  const finalChunk = { done: true };
  if (toolCallAccum.length > 0) {
    finalChunk.message = {
      tool_calls: toolCallAccum.map((tc) => ({
        id: tc.id,
        function: {
          name: tc.name,
          arguments: safeParseJSON(tc.arguments),
        },
      })),
    };
  }
  if (usage) {
    finalChunk.prompt_eval_count = usage.prompt_tokens || 0;
    finalChunk.eval_count = usage.completion_tokens || 0;
  }
  yield finalChunk;
}

function safeParseJSON(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

export function parseStream(response, backend) {
  if (backend === 'llamacpp') {
    return parseOpenAIStream(response);
  }
  return parseOllamaStream(response);
}

export async function* parseOllamaStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line);
      } catch {
        // Skip malformed lines
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer);
    } catch {
      // Skip
    }
  }
}
