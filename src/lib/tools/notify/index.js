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
    description: 'Send a reminder notification immediately (scheduling not yet supported)',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['message'],
    },
    handler: async ({ title, message }) => {
      return sendNotification({ title: title || 'Reminder', message, priority: 4, tags: ['bell'] });
    },
  },
];
