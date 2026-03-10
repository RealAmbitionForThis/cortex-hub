import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { parseJsonSafe } from '@/lib/utils/format';

function parseMetadata(jsonStr) {
  return parseJsonSafe(jsonStr, {});
}

export function addDocument({ title, type, content, file_path, metadata }) {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO documents (id, title, type, content, file_path, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, type || 'text', content || null, file_path || null, metadata ? JSON.stringify(metadata) : null, now);
  return id;
}

export function getDocuments({ type, search } = {}) {
  const db = getDb();
  let query = 'SELECT id, title, type, file_path, metadata, created_at FROM documents WHERE 1=1';
  const params = [];
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (search) { query += ' AND (title LIKE ? OR content LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params).map(d => ({ ...d, metadata: parseMetadata(d.metadata) }));
}

export function getDocumentById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, metadata: parseMetadata(row.metadata) };
}

export function deleteDocument(id) {
  const db = getDb();
  db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(id);
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}
