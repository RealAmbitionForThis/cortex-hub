import { SSETransport } from './transport';

export class McpClient {
  constructor(serverUrl) {
    this.transport = new SSETransport(serverUrl);
    this.requestId = 0;
    this.tools = [];
  }

  async connect() {
    await this.transport.connect();
    await this.initialize();
  }

  async initialize() {
    const result = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'cortex-hub', version: '1.0.0' },
    });
    return result;
  }

  async listTools() {
    const result = await this.request('tools/list', {});
    this.tools = result.tools || [];
    return this.tools;
  }

  async callTool(name, args = {}) {
    const result = await this.request('tools/call', { name, arguments: args });
    return result;
  }

  async request(method, params) {
    const id = ++this.requestId;
    const message = { jsonrpc: '2.0', id, method, params };
    return this.transport.send(message);
  }

  disconnect() {
    this.transport.disconnect();
  }
}

const clients = new Map();

export function getMcpClient(serverId, url) {
  if (!clients.has(serverId)) {
    clients.set(serverId, new McpClient(url));
  }
  return clients.get(serverId);
}

export function disconnectAll() {
  for (const client of clients.values()) client.disconnect();
  clients.clear();
}
