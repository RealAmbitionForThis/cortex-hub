const NTFY_URL = process.env.CORTEX_NTFY_URL || 'https://ntfy.sh';
const NTFY_TOPIC = process.env.CORTEX_NTFY_TOPIC || 'cortex-hub';

export async function sendNotification({ title, message, priority = 3, tags = [], click }) {
  try {
    const headers = {
      'Title': title || 'Cortex Hub',
      'Priority': String(priority),
    };
    if (tags.length > 0) headers['Tags'] = tags.join(',');
    if (click) headers['Click'] = click;

    const res = await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
      method: 'POST',
      headers,
      body: message || title,
    });

    return { success: res.ok, status: res.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function sendBillReminder(bill) {
  return sendNotification({
    title: `Bill Due: ${bill.name}`,
    message: `$${bill.amount} due on ${bill.next_due}`,
    priority: 4,
    tags: ['money_with_wings'],
  });
}

export async function sendTaskReminder(task) {
  return sendNotification({
    title: `Task Overdue: ${task.title}`,
    message: task.description || 'This task is past its due date',
    priority: 3,
    tags: ['warning'],
  });
}
