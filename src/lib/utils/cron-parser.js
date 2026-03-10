import cronstrue from 'cronstrue';

export function cronToHuman(expression) {
  try {
    return cronstrue.toString(expression);
  } catch {
    return 'Invalid cron expression';
  }
}

export function buildCronExpression(frequency, options = {}) {
  const { minute = 0, hour = 9, dayOfWeek = 1, dayOfMonth = 1, interval = 5 } = options;

  switch (frequency) {
    case 'minutes':
      return `*/${interval} * * * *`;
    case 'hourly':
      return `${minute} * * * *`;
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    default:
      return '0 9 * * *';
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
