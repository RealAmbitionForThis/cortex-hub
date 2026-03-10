import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getMonthRange } from '@/lib/utils/date';

export function addTransaction({ amount, category, description, date }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO transactions (id, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, amount, category, description || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function getTransactions({ period, category, limit } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (period) {
    const { start, end } = getMonthRange();
    query += ' AND date >= ? AND date <= ?';
    params.push(start, end);
  }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY date DESC LIMIT ?';
  params.push(limit || 100);

  return db.prepare(query).all(...params);
}

export function getBalance(period) {
  const { start, end } = getMonthRange();
  const db = getDb();
  const income = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE amount > 0 AND date >= ? AND date <= ?').get(start, end);
  const expenses = db.prepare('SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE amount < 0 AND date >= ? AND date <= ?').get(start, end);
  const incomeTotal = income?.total ?? 0;
  const expensesTotal = expenses?.total ?? 0;
  return { income: incomeTotal, expenses: expensesTotal, net: incomeTotal - expensesTotal };
}

export function getSpendingByCategory(period) {
  const { start, end } = getMonthRange();
  return getDb().prepare(
    'SELECT category, SUM(ABS(amount)) as total FROM transactions WHERE amount < 0 AND date >= ? AND date <= ? GROUP BY category ORDER BY total DESC'
  ).all(start, end);
}

export function setBudget({ category, monthly_limit }) {
  const id = uuidv4();
  getDb().prepare('INSERT OR REPLACE INTO budgets (id, category, monthly_limit, created_at) VALUES (?, ?, ?, datetime(\'now\'))').run(id, category, monthly_limit);
}

export function getBudgets() {
  return getDb().prepare('SELECT * FROM budgets').all();
}

export function addBill({ name, amount, frequency, due_day, category, auto_pay, notify_days_before }) {
  const id = uuidv4();
  const nextDue = calculateNextDue(frequency, due_day);
  getDb().prepare(
    'INSERT INTO bills (id, name, amount, frequency, due_day, next_due, category, auto_pay, notify_days_before, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, name, amount, frequency, due_day || null, nextDue, category || null, auto_pay ? 1 : 0, notify_days_before || 3);
  return id;
}

export function getBills() {
  return getDb().prepare('SELECT * FROM bills ORDER BY next_due ASC').all();
}

export function getUpcomingBills(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return getDb().prepare('SELECT * FROM bills WHERE next_due <= ? ORDER BY next_due ASC').all(cutoff.toISOString().split('T')[0]);
}

export function markBillPaid(billId) {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
  if (!bill) return null;

  const nextDue = calculateNextDue(bill.frequency, bill.due_day);
  db.prepare('UPDATE bills SET paid_this_cycle = 1, last_paid = date(\'now\'), next_due = ? WHERE id = ?').run(nextDue, billId);
  return { success: true, next_due: nextDue };
}

// --- Subscriptions ---

export function addSubscription({ name, amount, frequency, due_day, category, auto_pay, service_url, usage_rating }) {
  const id = uuidv4();
  const nextDue = calculateNextDue(frequency, due_day);
  getDb().prepare(
    'INSERT INTO bills (id, name, amount, frequency, due_day, next_due, category, auto_pay, is_subscription, service_url, usage_rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, datetime(\'now\'))'
  ).run(id, name, amount, frequency || 'monthly', due_day || null, nextDue, category || null, auto_pay ? 1 : 0, service_url || null, usage_rating || null);
  return id;
}

export function getSubscriptions() {
  return getDb().prepare('SELECT * FROM bills WHERE is_subscription = 1 ORDER BY name ASC').all();
}

export function getSubscriptionTotal() {
  const subs = getSubscriptions();
  let monthlyTotal = 0;
  for (const s of subs) {
    switch (s.frequency) {
      case 'weekly': monthlyTotal += s.amount * 4.33; break;
      case 'biweekly': monthlyTotal += s.amount * 2.17; break;
      case 'monthly': monthlyTotal += s.amount; break;
      case 'quarterly': monthlyTotal += s.amount / 3; break;
      case 'yearly': monthlyTotal += s.amount / 12; break;
      default: monthlyTotal += s.amount; break;
    }
  }
  return Math.round(monthlyTotal * 100) / 100;
}

export function updateSubscriptionUsage(id, usage_rating, last_used) {
  const sets = [];
  const vals = [];
  if (usage_rating !== undefined) { sets.push('usage_rating = ?'); vals.push(usage_rating); }
  if (last_used) { sets.push('last_used = ?'); vals.push(last_used); }
  if (sets.length === 0) return;
  vals.push(id);
  getDb().prepare(`UPDATE bills SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

export function deleteSubscription(id) {
  getDb().prepare('DELETE FROM bills WHERE id = ? AND is_subscription = 1').run(id);
}

// --- Wishlist ---

export function addWishlistItem({ name, target_price, current_price, url, priority, category, notes }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO wishlist_items (id, name, target_price, current_price, url, priority, category, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, name, target_price || null, current_price || null, url || null, priority || 'medium', category || null, notes || null);
  return id;
}

export function getWishlistItems({ priority, category, purchased } = {}) {
  let query = 'SELECT * FROM wishlist_items WHERE 1=1';
  const params = [];
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (purchased !== undefined) { query += ' AND purchased = ?'; params.push(purchased ? 1 : 0); }
  query += ' ORDER BY created_at DESC';
  return getDb().prepare(query).all(...params);
}

export function markWishlistPurchased(id) {
  getDb().prepare("UPDATE wishlist_items SET purchased = 1, purchased_at = datetime('now') WHERE id = ?").run(id);
}

export function deleteWishlistItem(id) {
  getDb().prepare('DELETE FROM wishlist_items WHERE id = ?').run(id);
}

// --- Savings Pods ---

export function createPod({ name, target_amount, wishlist_item_id, icon, color }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO savings_pods (id, name, target_amount, wishlist_item_id, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, name, target_amount, wishlist_item_id || null, icon || null, color || '#6366f1');
  return id;
}

export function getPods() {
  const db = getDb();
  const pods = db.prepare('SELECT * FROM savings_pods ORDER BY created_at DESC').all();
  return pods.map((p) => ({
    ...p,
    progress: p.target_amount > 0 ? Math.min(Math.round((p.current_amount / p.target_amount) * 100), 100) : 0,
  }));
}

export function contributeToPod(pod_id, amount, note) {
  const id = uuidv4();
  const db = getDb();
  db.prepare('INSERT INTO pod_contributions (id, pod_id, amount, note, date, created_at) VALUES (?, ?, ?, ?, date(\'now\'), datetime(\'now\'))').run(id, pod_id, amount, note || null);
  db.prepare('UPDATE savings_pods SET current_amount = current_amount + ? WHERE id = ?').run(amount, pod_id);
  return id;
}

export function getPodContributions(pod_id) {
  return getDb().prepare('SELECT * FROM pod_contributions WHERE pod_id = ? ORDER BY date DESC').all(pod_id);
}

export function deletePod(id) {
  getDb().prepare('DELETE FROM savings_pods WHERE id = ?').run(id);
}

export function getWishlistBudgetInsight() {
  const db = getDb();
  const { start, end } = getMonthRange();
  const entertainmentBudget = db.prepare("SELECT monthly_limit FROM budgets WHERE category = 'entertainment'").get();
  const entertainmentSpent = db.prepare("SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE amount < 0 AND category = 'entertainment' AND date >= ? AND date <= ?").get(start, end);
  const wishlistTotal = db.prepare('SELECT COALESCE(SUM(target_price), 0) as total FROM wishlist_items WHERE purchased = 0').get();

  const spentTotal = entertainmentSpent?.total ?? 0;
  const wishTotal = wishlistTotal?.total ?? 0;
  const budgetLeft = entertainmentBudget ? entertainmentBudget.monthly_limit - spentTotal : null;
  return {
    wishlist_total: wishTotal,
    entertainment_budget: entertainmentBudget?.monthly_limit ?? null,
    entertainment_spent: spentTotal,
    entertainment_remaining: budgetLeft,
    insight: budgetLeft !== null
      ? `You have $${budgetLeft.toFixed(2)} left in entertainment this month. Your wishlist totals $${wishTotal.toFixed(2)}.`
      : `Your wishlist totals $${wishTotal.toFixed(2)}. Set an entertainment budget to track against it.`,
  };
}

function calculateNextDue(frequency, dueDay) {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    default: break;
  }

  if (dueDay) next.setDate(dueDay);
  return next.toISOString().split('T')[0];
}
