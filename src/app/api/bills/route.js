import { NextResponse } from 'next/server';
import { addBill, getBills, getUpcomingBills, markBillPaid } from '@/lib/tools/money/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');
    const bills = days ? getUpcomingBills(parseInt(days)) : getBills();
    return NextResponse.json({ bills });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'mark_paid') {
      const result = markBillPaid(body.bill_id);
      return NextResponse.json(result || { error: 'Bill not found' });
    }
    const id = addBill(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
