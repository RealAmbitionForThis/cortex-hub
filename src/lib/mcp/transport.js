export class SSETransport {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.connected = false;
    this.abortController = null;
  }

  async connect() {
    // Use fetch-based SSE instead of EventSource (which is browser-only).
    // This works in both Node.js (Next.js API routes) and browser contexts.
    this.abortController = new AbortController();
    try {
      const res = await fetch(this.url, {
        headers: { 'Accept': 'text/event-stream' },
        signal: this.abortController.signal,
      });
      if (!res.ok) throw new Error(`MCP SSE connect failed: ${res.status}`);
      this.connected = true;

      // Process SSE stream in the background
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const self = this;

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const chunk of lines) {
              const dataLine = chunk.split('\n').find(l => l.startsWith('data: '));
              if (!dataLine) continue;
              try {
                const data = JSON.parse(dataLine.slice(6));
                for (const handler of self.messageHandlers) handler(data);
              } catch (e) {
                console.error('[mcp/transport] Failed to parse SSE message:', e.message);
              }
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error('[mcp/transport] SSE stream error:', e.message);
            for (const handler of self.errorHandlers) {
              try { handler(e); } catch { /* prevent handler errors from propagating */ }
            }
          }
        } finally {
          self.connected = false;
        }
      })();
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  async send(message) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      throw new Error(`MCP send failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  disconnect() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
  }
}
