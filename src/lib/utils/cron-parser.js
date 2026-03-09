import cronstrue from 'cronstrue';

export function cronToHuman(expression) {
  try {
    return cronstrue.toString(expression);
  } catch {
    return 'Invalid cron expression';
  }
}

export function getNextRunDate(cronExpression) {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const now = new Date();
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (minute !== '*') next.setMinutes(parseInt(minute, 10));
  if (hour !== '*') next.setHours(parseInt(hour, 10));

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}
