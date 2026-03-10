import { success, error, badRequest } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { scheduleJob, stopJob } from '@/lib/scheduler/cron';

export async function GET() {
  try {
    const db = getDb();
    const schedules = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all();
    return success({ schedules });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'toggle') {
      const db = getDb();
      db.prepare('UPDATE schedules SET enabled = ? WHERE id = ?').run(body.enabled ? 1 : 0, body.id);
      if (!body.enabled) stopJob(`custom-${body.id}`);
      return success();
    }

    if (body.action === 'delete') {
      const db = getDb();
      stopJob(`custom-${body.id}`);
      db.prepare('DELETE FROM schedules WHERE id = ?').run(body.id);
      return success();
    }

    if (!body.name || !body.cron_expression) {
      return badRequest('Name and cron_expression are required');
    }

    const db = getDb();
    const id = uuid();
    const params = JSON.stringify({
      project_id: body.project_id || null,
      tools: body.tools || [],
    });

    db.prepare(`
      INSERT INTO schedules (id, name, cron_expression, action, params, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      body.name,
      body.cron_expression,
      body.prompt || body.tool_action || '',
      params,
      new Date().toISOString()
    );

    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return badRequest('Schedule id is required');
    }

    // Handle simple toggle
    if (body.enabled !== undefined && Object.keys(body).length === 2) {
      const db = getDb();
      db.prepare('UPDATE schedules SET enabled = ? WHERE id = ?').run(body.enabled ? 1 : 0, body.id);
      if (!body.enabled) stopJob(`custom-${body.id}`);
      return success();
    }

    // Full update
    const db = getDb();
    const params = JSON.stringify({
      project_id: body.project_id || null,
      tools: body.tools || [],
    });

    db.prepare(`
      UPDATE schedules
      SET name = ?, cron_expression = ?, action = ?, params = ?, notify_via_ntfy = ?
      WHERE id = ?
    `).run(
      body.name,
      body.cron_expression,
      body.prompt || '',
      params,
      body.notify_via_ntfy ? 1 : 0,
      body.id
    );

    return success();
  } catch (err) {
    return error(err.message);
  }
}
