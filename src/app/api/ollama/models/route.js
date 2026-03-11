import { success, error, badRequest } from '@/lib/api/response';
import { resolveOllamaUrl } from '@/lib/llm/urls';

export async function GET() {
  try {
    const res = await fetch(`${resolveOllamaUrl()}/api/tags`, { cache: 'no-store' });
    if (!res.ok) {
      return error(`Ollama returned ${res.status}`, res.status);
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
      parameter_size: m.details?.parameter_size || null,
      quantization_level: m.details?.quantization_level || null,
      family: m.details?.family || null,
      format: m.details?.format || null,
    }));
    return success({ models });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name) return badRequest('Model name is required');

    const res = await fetch(`${resolveOllamaUrl()}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name }),
    });

    if (!res.ok) {
      return error(`Ollama returned ${res.status}`, res.status);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const event = {
                  status: parsed.status || '',
                  total: parsed.total || 0,
                  completed: parsed.completed || 0,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
              } catch {
                // skip malformed JSON lines
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              const event = {
                status: parsed.status || '',
                total: parsed.total || 0,
                completed: parsed.completed || 0,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch {
              // skip
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    if (!body.name) return badRequest('Model name is required');

    const res = await fetch(`${resolveOllamaUrl()}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name }),
    });

    if (!res.ok) {
      const text = await res.text();
      return error(text || `Ollama returned ${res.status}`, res.status);
    }

    return success({ deleted: body.name });
  } catch (err) {
    return error(err.message);
  }
}
