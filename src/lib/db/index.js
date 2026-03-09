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

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
