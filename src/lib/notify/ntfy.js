import { getDb } from '@/lib/db';

function getNtfyConfig() {
  // Read from DB settings first, fall back to env vars
  try {
    const db = getDb();
    const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'ntfy_url'").get();
    const topicRow = db.prepare("SELECT value FROM settings WHERE key = 'ntfy_topic'").get();
    const url = urlRow ? JSON.parse(urlRow.value) : null;
    const topic = topicRow ? JSON.parse(topicRow.value) : null;
    return {
      url: url || process.env.CORTEX_NTFY_URL || 'https://ntfy.sh',
      topic: topic || process.env.CORTEX_NTFY_TOPIC || '',
    };
  } catch {
    return {
      url: process.env.CORTEX_NTFY_URL || 'https://ntfy.sh',
      topic: process.env.CORTEX_NTFY_TOPIC || '',
    };
  }
}

export async function sendNotification({ title, message, priority = 3, tags = [], click }) {
  const { url: ntfyUrl, topic: ntfyTopic } = getNtfyConfig();
  if (!ntfyTopic) {
    return { success: false, error: 'ntfy topic not configured. Set it in Settings > Notifications.' };
  }
  try {
    const headers = {
      'Title': title || 'Cortex Hub',
      'Priority': String(priority),
    };
    if (tags.length > 0) headers['Tags'] = tags.join(',');
    if (click) headers['Click'] = click;

    const res = await fetch(`${ntfyUrl}/${ntfyTopic}`, {
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