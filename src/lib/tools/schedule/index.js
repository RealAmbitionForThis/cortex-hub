import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { scheduleJob, stopJob } from '@/lib/scheduler/cron';

export const scheduleTools = [
  {
    name: 'schedule.create',
    description: 'Create a scheduled task with a cron expression',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Schedule name' },
        cron_expression: { type: 'string', description: 'Cron expression (e.g., "0 9 * * *" for 9 AM daily)' },
        action: { type: 'string', description: 'Tool name to execute' },
        params: { type: 'object', description: 'Tool parameters' },
      },
      required: ['name', 'cron_expression', 'action'],
    },
    handler: async ({ name, cron_expression, action, params }) => {
      const db = getDb();
      const id = uuidv4();
      db.prepare(`
        INSERT INTO schedules (id, name, cron_expression, action, params, enabled, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(id, name, cron_expression, action, params ? JSON.stringify(params) : null, new Date().toISOString());

      scheduleJob(`custom-${id}`, cron_expression, async () => {
        const { executeTool } = await import('@/lib/tools/registry');
        await executeTool(action, params || {});
      });

      return { success: true, id };
    },
  },
  {
    name: 'schedule.list',
    description: 'List all scheduled tasks',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const db = getDb();
      const schedules = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all();
      return { schedules };
    },
  },
  {
    name: 'schedule.toggle',
    description: 'Enable or disable a schedule',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        enabled: { type: 'boolean' },
      },
      required: ['id', 'enabled'],
    },
    handler: async ({ id, enabled }) => {
      const db = getDb();
      db.prepare('UPDATE schedules SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
      if (!enabled) stopJob(`custom-${id}`);
      return { success: true };
    },
  },
  {
    name: 'schedule.delete',
    description: 'Delete a schedule',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async ({ id }) => {
      const db = getDb();
      stopJob(`custom-${id}`);
      db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
      return { success: true };
    },
  },
];
