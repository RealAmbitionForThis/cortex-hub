import { success, withHandler } from '@/lib/api/response';
import { getMcpServers, addMcpServer, updateMcpServer, deleteMcpServer } from '@/lib/mcp/registry';

export const GET = withHandler(async () => {
  return success({ servers: getMcpServers() });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  const id = addMcpServer(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  const { id, ...updates } = body;
  updateMcpServer(id, updates);
  return success();
});

export const DELETE = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  deleteMcpServer(id);
  return success();
});
