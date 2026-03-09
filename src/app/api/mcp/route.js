import { success, error } from '@/lib/api/response';
import { getMcpServers, addMcpServer, updateMcpServer, deleteMcpServer } from '@/lib/mcp/registry';

export async function GET() {
  try {
    return success({ servers: getMcpServers() });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = addMcpServer(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    updateMcpServer(id, updates);
    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    deleteMcpServer(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
