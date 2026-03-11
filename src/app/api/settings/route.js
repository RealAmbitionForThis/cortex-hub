import { success, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export const GET = withHandler(async () => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value); }
    catch { settings[row.key] = row.value; }
  }
  return success({ settings });
});

export const PUT = withHandler(async (request) => {
  const db = getDb();
  const body = await request.json();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))'
  );

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(body)) {
      stmt.run(key, JSON.stringify(value));
    }
  });

  transaction();
  return success();
});
