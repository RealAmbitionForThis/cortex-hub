import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notify/ntfy';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const notifications = db.prepare(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    ).all();
    const unread = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE read = 0'
    ).get();
    return NextResponse.json({ notifications, unread: unread.count });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'mark_read') {
      const db = getDb();
      if (body.id) {
        db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(body.id);
      } else {
        db.prepare('UPDATE notifications SET read = 1').run();
      }
      return NextResponse.json({ success: true });
    }

    const result = await sendNotification(body);

    // Store in DB
    const db = getDb();
    const { v4: uuid } = await import('uuid');
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(uuid(), body.title || 'Notification', body.message, body.type || 'info', new Date().toISOString());

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
