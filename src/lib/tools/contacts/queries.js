import { getDb, updateRow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseTags } from '@/lib/utils/format';

export function addContact({ name, email, phone, company, role, notes, birthday, tags }) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO contacts (id, name, email, phone, company, role, notes, birthday, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email || null, phone || null, company || null, role || null, notes || null, birthday || null, tags ? JSON.stringify(tags) : null, now, now);
  return id;
}

export function getContacts({ search, tag } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM contacts WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }
  query += ' ORDER BY name ASC';
  return db.prepare(query).all(...params).map(parseContact);
}

export function getContactById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  return row ? parseContact(row) : null;
}

export function updateContact(id, updates) {
  updateRow('contacts', id, updates, ['name', 'email', 'phone', 'company', 'role', 'notes', 'birthday', 'tags'], { serialize: ['tags'] });
}

export function deleteContact(id) {
  const db = getDb();
  db.prepare('DELETE FROM contact_interactions WHERE contact_id = ?').run(id);
  db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
}

export function addInteraction({ contact_id, type, notes, date }) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO contact_interactions (id, contact_id, type, notes, date)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, contact_id, type || 'note', notes || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function getInteractions(contact_id) {
  const db = getDb();
  return db.prepare('SELECT * FROM contact_interactions WHERE contact_id = ? ORDER BY date DESC').all(contact_id);
}

export function getUpcomingFollowups() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT c.*, ci.date as followup_date, ci.notes as followup_notes
    FROM contacts c
    JOIN contact_interactions ci ON c.id = ci.contact_id
    WHERE ci.type = 'followup' AND ci.date >= ?
    ORDER BY ci.date ASC LIMIT 20
  `).all(today).map(row => ({ ...parseContact(row), followup_date: row.followup_date, followup_notes: row.followup_notes }));
}

function parseContact(row) {
  return { ...row, tags: parseTags(row.tags) };
}
