import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseJsonSafe } from '@/lib/utils/format';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (date) {
      const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(date);
      if (log) {
        log.topics = parseJsonSafe(log.topics, []);
        log.highlights = parseJsonSafe(log.highlights, []);
        log.modules_touched = parseJsonSafe(log.modules_touched, []);
      }
      return NextResponse.json({ log });
    }

    let query = 'SELECT id, date, summary, mood, message_count FROM daily_logs';
    const params = [];

    if (month) {
      query += ' WHERE date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY date DESC LIMIT 90';
    const logs = db.prepare(query).all(...params);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
