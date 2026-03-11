import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

let db = null;

export function getDb() {
  if (db) return db;

  const dbPath = process.env.CORTEX_DB_PATH || './cortex.db';
  const resolvedPath = path.resolve(dbPath);

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  return db;
}

/**
 * Build and run a dynamic UPDATE query from an object of updates.
 * Only fields in `allowedFields` are applied; undefined values are skipped.
 * @param {string} table - Table name
 * @param {string} id - Row ID
 * @param {Object} updates - Key-value pairs to update
 * @param {string[]} allowedFields - Whitelist of column names
 * @param {{ addTimestamp?: boolean, serialize?: string[] }} opts
 */
export function updateRow(table, id, updates, allowedFields, opts = {}) {
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(updates)) {
    if (!allowedFields.includes(key) || val === undefined) continue;
    sets.push(`${key} = ?`);
    vals.push(opts.serialize?.includes(key) && typeof val === 'object' ? JSON.stringify(val) : val);
  }
  if (sets.length === 0) return false;
  if (opts.addTimestamp !== false) sets.push("updated_at = datetime('now')");
  vals.push(id);
  getDb().prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return true;
}
