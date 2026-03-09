import { success, error } from '@/lib/api/response';
import { getAllClusters, createCluster } from '@/lib/tools/cluster/queries';

export async function GET() {
  try {
    return success({ clusters: getAllClusters() });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = createCluster(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
