import { success, error, notFound } from '@/lib/api/response';
import { getClusterById, updateCluster, deleteCluster } from '@/lib/tools/cluster/queries';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cluster = getClusterById(id);
    if (!cluster) return notFound('Cluster not found');
    return success({ cluster });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    updateCluster(id, body);
    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    deleteCluster(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
