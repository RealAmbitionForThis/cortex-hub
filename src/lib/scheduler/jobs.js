import { scheduleJob } from './cron';
import { getDb } from '@/lib/db';

export function initializeBuiltInJobs() {
  // Memory analyzer — every 6 hours
  scheduleJob('memory-analyzer', '0 */6 * * *', async () => {
    try {
      const { analyzeRecentConversations } = await import('@/lib/memory/analyzer');
      await analyzeRecentConversations();
    } catch {}
  });

  // Daily log — 11 PM daily
  scheduleJob('daily-log', '0 23 * * *', async () => {
    try {
      const { generateDailyLog } = await import('@/lib/memory/daily-log');
      await generateDailyLog();
    } catch {}
  });

  // Bill check — 9 AM daily
  scheduleJob('bill-check', '0 9 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const bills = db.prepare(
        "SELECT * FROM bills WHERE next_due_date BETWEEN ? AND ? AND status = 'active'"
      ).all(today, tomorrow);

      if (bills.length > 0) {
        const { sendBillReminder } = await import('@/lib/notify/ntfy');
        for (const bill of bills) await sendBillReminder(bill);
      }
    } catch {}
  });

  // Task overdue check — 10 AM daily
  scheduleJob('task-overdue', '0 10 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const tasks = db.prepare(
        "SELECT * FROM tasks WHERE due_date < ? AND status != 'completed'"
      ).all(today);

      if (tasks.length > 0) {
        const { sendNotification } = await import('@/lib/notify/ntfy');
        await sendNotification({
          title: `${tasks.length} Overdue Tasks`,
          message: tasks.map(t => t.title).join(', '),
          priority: 3,
          tags: ['warning'],
        });
      }
    } catch {}
  });
}

export function loadCustomSchedules() {
  try {
    const db = getDb();
    const schedules = db.prepare("SELECT * FROM schedules WHERE enabled = 1").all();
    for (const schedule of schedules) {
      scheduleJob(`custom-${schedule.id}`, schedule.cron_expression, async () => {
        try {
          const { executeTool } = await import('@/lib/tools/registry');
          await executeTool(schedule.action, JSON.parse(schedule.params || '{}'));
        } catch {}
      });
    }
  } catch {}
}
