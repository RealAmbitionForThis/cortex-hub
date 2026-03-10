import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function addImportantDate({ title, date, type, description, recurring, reminder_days_before, contact_id, tags, notify }) {
  const id = uuidv4();
  getDb().prepare(
    `INSERT INTO important_dates (id, title, date, type, description, recurring, reminder_days_before, contact_id, tags, notify, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(id, title, date, type || 'other', description || null, recurring || null, reminder_days_before ?? 7, contact_id || null, tags ? JSON.stringify(tags) : null, notify !== undefined ? (notify ? 1 : 0) : 1);
  return id;
}

export function getImportantDates({ type, upcoming_days, past } = {}) {
  let query = 'SELECT * FROM important_dates WHERE 1=1';
  const params = [];
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (upcoming_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + upcoming_days);
    query += " AND date >= date('now') AND date <= ?";
    params.push(cutoff.toISOString().split('T')[0]);
  }
  if (past) {
    query += " AND date < date('now')";
  }
  query += ' ORDER BY date ASC';
  return getDb().prepare(query).all(...params).map(d => ({
    ...d,
    tags: d.tags ? JSON.parse(d.tags) : [],
  }));
}

export function getImportantDate(id) {
  const d = getDb().prepare('SELECT * FROM important_dates WHERE id = ?').get(id);
  if (d && d.tags) d.tags = JSON.parse(d.tags);
  return d;
}

export function updateImportantDate(id, updates) {
  const allowed = ['title', 'date', 'type', 'description', 'recurring', 'reminder_days_before', 'contact_id', 'tags', 'notify'];
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(updates)) {
    if (allowed.includes(key) && val !== undefined) {
      if (key === 'tags' && Array.isArray(val)) {
        sets.push('tags = ?');
        vals.push(JSON.stringify(val));
      } else {
        sets.push(`${key} = ?`);
        vals.push(val);
      }
    }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  getDb().prepare(`UPDATE important_dates SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

export function deleteImportantDate(id) {
  getDb().prepare('DELETE FROM important_dates WHERE id = ?').run(id);
}

export function getUpcomingReminders() {
  // Get dates that need notification based on their reminder_days_before setting
  const db = getDb();
  const dates = db.prepare(`
    SELECT * FROM important_dates
    WHERE notify = 1
    AND date >= date('now')
    AND date <= date('now', '+' || reminder_days_before || ' days')
    AND (last_notified IS NULL OR last_notified < date('now'))
    ORDER BY date ASC
  `).all();

  return dates.map(d => ({
    ...d,
    tags: d.tags ? JSON.parse(d.tags) : [],
    days_until: Math.ceil((new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24)),
  }));
}

export function markNotified(id) {
  getDb().prepare("UPDATE important_dates SET last_notified = date('now') WHERE id = ?").run(id);
}

export function getDateStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM important_dates').get();
  const upcoming30 = db.prepare(
    "SELECT COUNT(*) as count FROM important_dates WHERE date BETWEEN date('now') AND date('now', '+30 days')"
  ).get();
  const overdue = db.prepare(
    "SELECT COUNT(*) as count FROM important_dates WHERE date < date('now') AND recurring IS NULL"
  ).get();
  const nextDate = db.prepare(
    "SELECT * FROM important_dates WHERE date >= date('now') ORDER BY date ASC LIMIT 1"
  ).get();

  return {
    total: total.count,
    upcoming_30: upcoming30.count,
    overdue: overdue.count,
    next: nextDate ? { title: nextDate.title, date: nextDate.date, type: nextDate.type } : null,
  };
}

// For the life timeline view
export function getTimeline(year) {
  let query = 'SELECT * FROM important_dates';
  const params = [];
  if (year) {
    query += ' WHERE date LIKE ?';
    params.push(`${year}%`);
  }
  query += ' ORDER BY date ASC';
  return getDb().prepare(query).all(...params).map(d => ({
    ...d,
    tags: d.tags ? JSON.parse(d.tags) : [],
  }));
}
