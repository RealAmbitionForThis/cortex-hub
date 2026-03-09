import { success, error, badRequest } from '@/lib/api/response';
import { addTransaction, getTransactions, getBalance, getSpendingByCategory, getBudgets, setBudget } from '@/lib/tools/money/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'balance') return success(getBalance());
    if (view === 'spending') return success({ spending: getSpendingByCategory() });
    if (view === 'budgets') return success({ budgets: getBudgets() });

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 1000);
    return success({ transactions: getTransactions({ limit }) });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.type === 'budget') {
      if (!body.category) return badRequest('Category required');
      setBudget(body);
      return success();
    }
    if (!body.amount) return badRequest('Amount required');
    const id = addTransaction(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
