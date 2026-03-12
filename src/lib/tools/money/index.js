import { addTransaction, getBalance, getSpendingByCategory, setBudget, addBill, getUpcomingBills, markBillPaid, getTransactions, addSubscription, getSubscriptions, getSubscriptionTotal, updateSubscriptionUsage, addWishlistItem, getWishlistItems, markWishlistPurchased, createPod, getPods, contributeToPod, getWishlistBudgetInsight } from './queries';

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
    handler: ({ period, category }) => {
      let spending = getSpendingByCategory(period);
      if (category) {
        spending = spending.filter(s => s.category === category);
      }
      return { spending };
    },
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
    name: 'money.add_subscription',
    description: 'Add a recurring subscription (Netflix, Spotify, gym, etc.)',
    parameters: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'number' }, frequency: { type: 'string', description: 'monthly/weekly/yearly etc.' }, category: { type: 'string' }, service_url: { type: 'string' }, usage_rating: { type: 'number', description: '1-5 how much you use it' } }, required: ['name', 'amount'] },
    handler: (p) => ({ success: true, id: addSubscription(p) }),
  },
  {
    name: 'money.get_subscriptions',
    description: 'Get all active subscriptions with total monthly burn',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ subscriptions: getSubscriptions(), monthly_total: getSubscriptionTotal() }),
  },
  {
    name: 'money.rate_subscription_usage',
    description: 'Rate how much you use a subscription (1-5)',
    parameters: { type: 'object', properties: { id: { type: 'string' }, usage_rating: { type: 'number' }, last_used: { type: 'string' } }, required: ['id', 'usage_rating'] },
    handler: (p) => { updateSubscriptionUsage(p.id, p.usage_rating, p.last_used); return { success: true }; },
  },
  {
    name: 'money.add_wishlist_item',
    description: 'Add an item to the wishlist with target price, priority, and optional link',
    parameters: { type: 'object', properties: { name: { type: 'string' }, target_price: { type: 'number' }, url: { type: 'string' }, priority: { type: 'string', description: 'low/medium/high' }, category: { type: 'string' }, notes: { type: 'string' } }, required: ['name'] },
    handler: (p) => ({ success: true, id: addWishlistItem(p) }),
  },
  {
    name: 'money.get_wishlist',
    description: 'Get wishlist items with optional filtering and budget insight',
    parameters: { type: 'object', properties: { priority: { type: 'string' }, purchased: { type: 'boolean' } } },
    handler: (p) => ({ items: getWishlistItems(p), insight: getWishlistBudgetInsight() }),
  },
  {
    name: 'money.create_pod',
    description: 'Create a savings pod to save toward a goal or wishlist item',
    parameters: { type: 'object', properties: { name: { type: 'string' }, target_amount: { type: 'number' }, wishlist_item_id: { type: 'string' } }, required: ['name', 'target_amount'] },
    handler: (p) => ({ success: true, id: createPod(p) }),
  },
  {
    name: 'money.contribute_to_pod',
    description: 'Add money to a savings pod',
    parameters: { type: 'object', properties: { pod_id: { type: 'string' }, amount: { type: 'number' }, note: { type: 'string' } }, required: ['pod_id', 'amount'] },
    handler: (p) => ({ success: true, id: contributeToPod(p.pod_id, p.amount, p.note) }),
  },
  {
    name: 'money.get_pods',
    description: 'Get all savings pods with progress',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ pods: getPods() }),
  },
];
