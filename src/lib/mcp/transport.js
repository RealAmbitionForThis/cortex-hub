export class SSETransport {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.messageHandlers = [];
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.connected = true;
        resolve();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          for (const handler of this.messageHandlers) handler(data);
        } catch (e) {
          console.error('[mcp/transport] Failed to parse SSE message:', e.message);
        }
      };

      this.eventSource.onerror = (err) => {
        this.connected = false;
        if (!this.connected) reject(err);
      };
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
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
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
  }
}
