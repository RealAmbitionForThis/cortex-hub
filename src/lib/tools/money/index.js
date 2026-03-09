import { addTransaction, getBalance, getSpendingByCategory, setBudget, addBill, getUpcomingBills, markBillPaid, getTransactions } from './queries';

export const moneyTools = [
  {
    name: 'money.add_transaction',
    description: 'Add a financial transaction (positive = income, negative = expense)',
    parameters: { type: 'object', properties: { amount: { type: 'number' }, category: { type: 'string' }, description: { type: 'string' }, date: { type: 'string' } }, required: ['amount', 'category'] },
    handler: (params) => {
      const id = addTransaction(params);
      const balance = getBalance();
      return { success: true, id, balance };
    },
  },
  {
    name: 'money.get_balance',
    description: 'Get income, expenses, and net balance for the current period',
    parameters: { type: 'object', properties: { period: { type: 'string' } } },
    handler: ({ period }) => getBalance(period),
  },
  {
    name: 'money.get_spending',
    description: 'Get spending breakdown by category',
    parameters: { type: 'object', properties: { period: { type: 'string' }, category: { type: 'string' } } },
    handler: ({ period, category }) => ({ spending: getSpendingByCategory(period) }),
  },
  {
    name: 'money.set_budget',
    description: 'Set a monthly budget limit for a category',
    parameters: { type: 'object', properties: { category: { type: 'string' }, monthly_limit: { type: 'number' } }, required: ['category', 'monthly_limit'] },
    handler: (params) => { setBudget(params); return { success: true }; },
  },
  {
    name: 'money.add_bill',
    description: 'Add a recurring bill or upcoming expense',
    parameters: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'number' }, frequency: { type: 'string' }, due_day: { type: 'number' }, category: { type: 'string' }, auto_pay: { type: 'boolean' } }, required: ['name', 'amount', 'frequency'] },
    handler: (params) => { const id = addBill(params); return { success: true, id }; },
  },
  {
    name: 'money.get_upcoming_bills',
    description: 'Get bills due in the next N days',
    parameters: { type: 'object', properties: { days: { type: 'number' } } },
    handler: ({ days }) => ({ bills: getUpcomingBills(days || 30) }),
  },
  {
    name: 'money.mark_bill_paid',
    description: 'Mark a bill as paid for the current cycle',
    parameters: { type: 'object', properties: { bill_id: { type: 'string' } }, required: ['bill_id'] },
    handler: ({ bill_id }) => markBillPaid(bill_id),
  },
  {
    name: 'money.import_csv',
    description: 'Import transactions from a CSV file',
    parameters: { type: 'object', properties: { filepath: { type: 'string' } }, required: ['filepath'] },
    handler: () => ({ message: 'CSV import not yet configured from chat. Use the Exports page.' }),
  },
];
