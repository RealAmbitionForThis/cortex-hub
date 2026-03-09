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
  return { income: income.total, expenses: expenses.total, net: income.total - expenses.total };
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
