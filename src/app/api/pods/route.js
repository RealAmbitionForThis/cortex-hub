import { success, badRequest, withHandler } from '@/lib/api/response';
import { createPod, getPods, contributeToPod, getPodContributions, deletePod } from '@/lib/tools/money/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const podId = searchParams.get('pod_id');

  if (podId) {
    const contributions = getPodContributions(podId);
    return success({ contributions });
  }

  const pods = getPods();
  return success({ pods });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();

  if (body.action === 'contribute') {
    if (!body.pod_id || !body.amount) return badRequest('Pod ID and amount required');
    const id = contributeToPod(body.pod_id, body.amount, body.note);
    return success({ id });
  }

  if (body.action === 'delete') {
    if (!body.id) return badRequest('Pod ID required');
    deletePod(body.id);
    return success();
  }

  if (!body.name || !body.target_amount) return badRequest('Name and target amount required');
  const id = createPod(body);
  return success({ id });
});
