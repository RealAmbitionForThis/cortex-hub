import { success, notFound, withHandler } from '@/lib/api/response';
import { getClusterById, updateCluster, deleteCluster } from '@/lib/tools/cluster/queries';

export const GET = withHandler(async (request, { params }) => {
  const { id } = await params;
  const cluster = getClusterById(id);
  if (!cluster) return notFound('Cluster not found');
  return success({ cluster });
});

export const PUT = withHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  updateCluster(id, body);
  return success();
});

export const DELETE = withHandler(async (request, { params }) => {
  const { id } = await params;
  deleteCluster(id);
  return success();
});
