import { scheduleJob } from './cron';
import { getDb } from '@/lib/db';

export function initializeBuiltInJobs() {
  // Memory analyzer — every 6 hours
  scheduleJob('memory-analyzer', '0 */6 * * *', async () => {
    try {
      const { analyzeRecentConversations } = await import('@/lib/memory/analyzer');
      await analyzeRecentConversations();
    } catch (e) { console.error('[scheduler] memory-analyzer job failed:', e.message); }
  });

  // Daily log — 11 PM daily
  scheduleJob('daily-log', '0 23 * * *', async () => {
    try {
      const { generateDailyLog } = await import('@/lib/memory/daily-log');
      await generateDailyLog();
    } catch (e) { console.error('[scheduler] daily-log job failed:', e.message); }
  });

  // Bill check — 9 AM daily
  scheduleJob('bill-check', '0 9 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const bills = db.prepare(
        "SELECT * FROM bills WHERE next_due BETWEEN ? AND ?"
      ).all(today, tomorrow);

      if (bills.length > 0) {
        const { sendBillReminder } = await import('@/lib/notify/ntfy');
        for (const bill of bills) await sendBillReminder(bill);
      }
    } catch (e) { console.error('[scheduler] bill-check job failed:', e.message); }
  });

  // Important dates reminder — 8 AM daily
  scheduleJob('important-dates-check', '0 8 * * *', async () => {
    try {
      const { getUpcomingReminders, markNotified } = await import('@/lib/tools/dates/queries');
      const reminders = getUpcomingReminders();
      if (reminders.length > 0) {
        const { sendNotification } = await import('@/lib/notify/ntfy');
        for (const r of reminders) {
          await sendNotification({
            title: `Upcoming: ${r.title}`,
            message: `${r.type.replace(/_/g, ' ')} on ${r.date} (${r.days_until} day${r.days_until !== 1 ? 's' : ''} away)${r.description ? ` — ${r.description}` : ''}`,
            priority: r.days_until <= 3 ? 4 : 3,
            tags: ['calendar'],
          });
          markNotified(r.id);
        }
      }
    } catch (e) { console.error('[scheduler] important-dates-check job failed:', e.message); }
  });

  // Warranty expiry check — 9 AM on Mondays
  scheduleJob('warranty-check', '0 9 * * 1', async () => {
    try {
      const { getExpiringWarranties } = await import('@/lib/tools/inventory/queries');
      const expiring = getExpiringWarranties(30);
      if (expiring.length > 0) {
        const { sendNotification } = await import('@/lib/notify/ntfy');
        await sendNotification({
          title: `${expiring.length} Warranty Expir${expiring.length === 1 ? 'y' : 'ies'} Soon`,
          message: expiring.map(i => `${i.name}: expires ${i.warranty_expiry}`).join(', '),
          priority: 3,
          tags: ['shield'],
        });
      }
    } catch (e) { console.error('[scheduler] warranty-check job failed:', e.message); }
  });

  // Task overdue check — 10 AM daily
  scheduleJob('task-overdue', '0 10 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const tasks = db.prepare(
        "SELECT * FROM tasks WHERE due_date < ? AND status != 'done'"
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
    } catch (e) { console.error('[scheduler] task-overdue job failed:', e.message); }
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
          const params = (() => { try { return JSON.parse(schedule.params || '{}'); } catch { return {}; } })();
          await executeTool(schedule.action, params);
        } catch (e) { console.error(`[scheduler] custom-${schedule.id} job failed:`, e.message); }
      });
    }
  } catch (e) { console.error('[scheduler] Failed to load custom schedules:', e.message); }
}
