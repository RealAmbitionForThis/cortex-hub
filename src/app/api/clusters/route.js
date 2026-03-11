import { success, withHandler } from '@/lib/api/response';
import { getAllClusters, createCluster } from '@/lib/tools/cluster/queries';

export const GET = withHandler(async () => {
  return success({ clusters: getAllClusters() });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  const id = createCluster(body);
  return success({ id });
});
