import { success, error } from '@/lib/api/response';
import { sendNotification } from '@/lib/notify/ntfy';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const notifications = db.prepare(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    ).all();
    const unread = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE read = 0'
    ).get();
    return success({ notifications, unread: unread.count });
  } catch (err) {
    return error(err.message);
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
        db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
      }
      return success();
    }

    const result = await sendNotification(body);

    const db = getDb();
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(uuidv4(), body.title || 'Notification', body.message, body.type || 'info', new Date().toISOString());

    return success(result);
  } catch (err) {
    return error(err.message);
  }
}
