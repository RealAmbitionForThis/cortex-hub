import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function logExport({ filename, format, module: mod, row_count }) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO exports (id, filename, format, module, row_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, filename, format, mod || 'general', row_count || 0, new Date().toISOString());
  return id;
}

export function getExportHistory(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM exports ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function getModuleData(mod) {
  const db = getDb();
  const queries = {
    transactions: 'SELECT * FROM transactions ORDER BY date DESC',
    tasks: 'SELECT * FROM tasks ORDER BY created_at DESC',
    contacts: 'SELECT * FROM contacts ORDER BY name ASC',
    meals: 'SELECT * FROM meals ORDER BY date DESC',
    workouts: 'SELECT * FROM workouts ORDER BY date DESC',
    vehicles: 'SELECT * FROM vehicles ORDER BY created_at DESC',
    maintenance: 'SELECT * FROM maintenance_logs ORDER BY date DESC',
    memories: 'SELECT id, content, category, module, memory_type, created_at FROM memories ORDER BY created_at DESC',
  };
  const query = queries[mod];
  if (!query) return [];
  return db.prepare(query).all();
}
