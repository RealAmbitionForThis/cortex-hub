import cron from 'node-cron';

const jobs = new Map();

export function scheduleJob(id, expression, callback) {
  if (jobs.has(id)) {
    jobs.get(id).stop();
  }

  if (!cron.validate(expression)) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  const task = cron.schedule(expression, callback, { scheduled: true });
  jobs.set(id, task);
  return task;
}

export function stopJob(id) {
  const job = jobs.get(id);
  if (job) {
    job.stop();
    jobs.delete(id);
  }
}
