import { success, error, badRequest } from '@/lib/api/response';
import { addBill, getBills, getUpcomingBills, markBillPaid } from '@/lib/tools/money/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');
    const limit = days ? Math.min(Math.max(parseInt(days, 10), 1), 365) : undefined;
    const bills = limit ? getUpcomingBills(limit) : getBills();
    return success({ bills });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'mark_paid') {
      if (!body.bill_id) return badRequest('Bill ID required');
      markBillPaid(body.bill_id);
      return success();
    }
    if (!body.name || !body.amount) return badRequest('Name and amount required');
    const id = addBill(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
