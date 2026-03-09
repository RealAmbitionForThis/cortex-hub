import { NextResponse } from 'next/server';
import { addTransaction, getTransactions, getBalance, getSpendingByCategory, getBudgets, setBudget } from '@/lib/tools/money/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'balance') return NextResponse.json(getBalance());
    if (view === 'spending') return NextResponse.json({ spending: getSpendingByCategory() });
    if (view === 'budgets') return NextResponse.json({ budgets: getBudgets() });

    const transactions = getTransactions({ limit: parseInt(searchParams.get('limit') || '100') });
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.type === 'budget') {
      setBudget(body);
      return NextResponse.json({ success: true });
    }
    const id = addTransaction(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
