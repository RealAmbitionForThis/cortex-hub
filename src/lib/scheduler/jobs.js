import { scheduleJob } from './cron';
import { analyzeRecentConversations } from '@/lib/memory/analyzer';
import { generateDailyLog } from '@/lib/memory/daily-log';
import { sendBillReminder, sendNotification } from '@/lib/notify/ntfy';
import { getDb } from '@/lib/db';

/**
 * Registers all built-in system jobs with the cron scheduler.
 * Called once at startup to kick off the automated backbone.
 */
export function registerBuiltInJobs() {
  // Memory analyzer — every 5 minutes
  scheduleJob('builtin-memory-analyzer', '*/5 * * * *', async () => {
    try {
      await analyzeRecentConversations();
    } catch (e) {
      console.error('[jobs] Memory analysis failed:', e.message);
    }
  });

  // Daily log — end of day (23:59)
  const dailyLogTime = process.env.CORTEX_DAILY_LOG_TIME || '23:59';
  const [hour, minute] = dailyLogTime.split(':');
  scheduleJob('builtin-daily-log', `${minute} ${hour} * * *`, async () => {
    try {
      await generateDailyLog();
    } catch (e) {
      console.error('[jobs] Daily log generation failed:', e.message);
    }
  });

  // Bill reminders — every day at 9:00 AM
  scheduleJob('builtin-bill-reminders', '0 9 * * *', async () => {
    try {
      const db = getDb();
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dueBills = db.prepare(
        'SELECT name, amount, next_due FROM bills WHERE next_due <= ? AND paid_this_cycle = 0 ORDER BY next_due ASC'
      ).all(tomorrow);
      for (const bill of dueBills) {
        await sendBillReminder(bill);
      }
    } catch (e) {
      console.error('[jobs] Bill reminders failed:', e.message);
    }
  });

  // Task overdue checks — every day at 8:00 AM
  scheduleJob('builtin-task-overdue', '0 8 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const overdue = db.prepare(
        "SELECT title, due_date, priority FROM tasks WHERE status NOT IN ('done', 'cancelled') AND due_date < ? ORDER BY due_date ASC"
      ).all(today);
      if (overdue.length > 0) {
        const list = overdue.map((t) => `- ${t.title} (due ${t.due_date})`).join('\n');
        await sendNotification({
          title: `${overdue.length} Overdue Task${overdue.length > 1 ? 's' : ''}`,
          message: list,
          priority: 4,
          tags: ['warning'],
        });
      }
    } catch (e) {
      console.error('[jobs] Task overdue check failed:', e.message);
    }
  });

  // Morning briefing — every day at 7:00 AM
  scheduleJob('builtin-morning-briefing', '0 7 * * *', async () => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const tasks = db.prepare(
        "SELECT title, due_date FROM tasks WHERE status NOT IN ('done', 'cancelled') AND due_date <= ? ORDER BY due_date ASC LIMIT 5"
      ).all(weekFromNow);

      const bills = db.prepare(
        'SELECT name, amount, next_due FROM bills WHERE next_due <= ? AND paid_this_cycle = 0 ORDER BY next_due ASC LIMIT 5'
      ).all(weekFromNow);

      const parts = ['Good morning! Here is your briefing:'];
      if (tasks.length > 0) {
        parts.push(`Tasks: ${tasks.map((t) => t.title).join(', ')}`);
      }
      if (bills.length > 0) {
        parts.push(`Bills: ${bills.map((b) => `${b.name} ($${b.amount})`).join(', ')}`);
      }
      if (tasks.length === 0 && bills.length === 0) {
        parts.push('Nothing urgent on the radar. Have a great day!');
      }

      await sendNotification({
        title: 'Morning Briefing',
        message: parts.join('\n'),
        priority: 3,
        tags: ['sunrise'],
      });
    } catch (e) {
      console.error('[jobs] Morning briefing failed:', e.message);
    }
  });

  console.log('[jobs] Built-in jobs registered');
}
