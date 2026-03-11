import { success, badRequest, withHandler } from '@/lib/api/response';
import { addBill, getBills, getUpcomingBills, markBillPaid, addSubscription, getSubscriptions, getSubscriptionTotal, updateSubscriptionUsage, deleteSubscription, updateBill, deleteBill } from '@/lib/tools/money/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  if (view === 'subscriptions') {
    return success({ subscriptions: getSubscriptions(), monthly_total: getSubscriptionTotal() });
  }
  const days = searchParams.get('days');
  const limit = days ? Math.min(Math.max(parseInt(days, 10), 1), 365) : undefined;
  const bills = limit ? getUpcomingBills(limit) : getBills();
  return success({ bills });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (body.action === 'mark_paid') {
    if (!body.bill_id) return badRequest('Bill ID required');
    markBillPaid(body.bill_id);
    return success();
  }
  if (body.action === 'add_subscription') {
    if (!body.name || !body.amount) return badRequest('Name and amount required');
    const id = addSubscription(body);
    return success({ id });
  }
  if (body.action === 'rate_subscription') {
    if (!body.id) return badRequest('Subscription ID required');
    updateSubscriptionUsage(body.id, body.usage_rating, body.last_used);
    return success();
  }
  if (body.action === 'delete_subscription') {
    if (!body.id) return badRequest('Subscription ID required');
    deleteSubscription(body.id);
    return success();
  }
  if (!body.name || !body.amount) return badRequest('Name and amount required');
  const id = addBill(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Bill ID required');
  updateBill(body.id, body);
  return success();
});

export const DELETE = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('Bill ID required');
  deleteBill(id);
  return success();
});
