import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { scheduleJob, stopJob } from '@/lib/scheduler/cron';

export async function GET() {
  try {
    const db = getDb();
    const schedules = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all();
    return NextResponse.json({ schedules });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'toggle') {
      const db = getDb();
      db.prepare('UPDATE schedules SET enabled = ? WHERE id = ?').run(body.enabled ? 1 : 0, body.id);
      if (!body.enabled) stopJob(`custom-${body.id}`);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'delete') {
      const db = getDb();
      stopJob(`custom-${body.id}`);
      db.prepare('DELETE FROM schedules WHERE id = ?').run(body.id);
      return NextResponse.json({ success: true });
    }

    const db = getDb();
    const id = uuid();
    db.prepare(`
      INSERT INTO schedules (id, name, cron_expression, action, params, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, body.name, body.cron_expression, body.tool_action, body.params ? JSON.stringify(body.params) : null, new Date().toISOString());

    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
