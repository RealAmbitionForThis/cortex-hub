import { sendNotification } from '@/lib/notify/ntfy';

export const notifyTools = [
  {
    name: 'notify.send',
    description: 'Send a push notification via ntfy',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        priority: { type: 'number', description: '1-5, where 5 is urgent' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['message'],
    },
    handler: async (args) => sendNotification(args),
  },
  {
    name: 'notify.reminder',
    description: 'Set a reminder notification',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        delay: { type: 'string', description: 'e.g. "30m", "1h", "2d"' },
      },
      required: ['message'],
    },
    handler: async ({ title, message, delay }) => {
      // For immediate send; scheduled via cron in Phase 19
      return sendNotification({ title: title || 'Reminder', message, priority: 4, tags: ['bell'] });
    },
  },
];
