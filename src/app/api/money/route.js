import { success, badRequest, withHandler } from '@/lib/api/response';
import { addTransaction, getTransactions, getBalance, getSpendingByCategory, getBudgets, setBudget, updateTransaction, deleteTransaction, addPayroll, getPayroll, deletePayroll } from '@/lib/tools/money/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view === 'balance') return success(getBalance());
  if (view === 'spending') {
    const period = searchParams.get('period');
    const category = searchParams.get('category');
    let spending = getSpendingByCategory(period || undefined);
    if (category) {
      spending = spending.filter(s => s.category === category);
    }
    return success({ spending });
  }
  if (view === 'budgets') return success({ budgets: getBudgets() });

  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 1000);
  return success({ transactions: getTransactions({ limit }) });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (body.type === 'budget') {
    if (!body.category) return badRequest('Category required');
    setBudget(body);
    return success();
  }
  if (body.action === 'add_payroll') {
    if (!body.name || !body.amount) return badRequest('Name and amount required');
    const id = addPayroll(body);
    return success({ id });
  }
  if (body.action === 'get_payroll') {
    return success({ payroll: getPayroll() });
  }
  if (body.action === 'delete_payroll') {
    if (!body.id) return badRequest('Payroll ID required');
    deletePayroll(body.id);
    return success();
  }
  if (!body.amount) return badRequest('Amount required');
  const id = addTransaction(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Transaction ID required');
  updateTransaction(body.id, body);
  return success();
});

export const DELETE = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Transaction ID required');
  deleteTransaction(body.id);
  return success();
});
