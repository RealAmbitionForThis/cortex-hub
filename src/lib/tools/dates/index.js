import { addImportantDate, getImportantDates, getImportantDate, updateImportantDate, deleteImportantDate, getUpcomingReminders, getDateStats, getTimeline } from './queries';

export const dateTools = [
  {
    name: 'dates.add',
    description: 'Add an important date (passport expiry, lease renewal, car registration, insurance, license, birthday, anniversary, etc.)',
    parameters: { type: 'object', properties: { title: { type: 'string' }, date: { type: 'string', description: 'YYYY-MM-DD format' }, type: { type: 'string', description: 'passport_expiry, license_expiry, lease_renewal, car_registration, insurance_renewal, visa_expiry, anniversary, birthday, appointment, deadline, milestone, other' }, description: { type: 'string' }, recurring: { type: 'string', description: 'yearly, monthly, or null for one-time' }, reminder_days_before: { type: 'number', description: 'Days before to send reminder (default 7)' }, contact_id: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, notify: { type: 'boolean' } }, required: ['title', 'date'] },
    handler: (p) => ({ success: true, id: addImportantDate(p) }),
  },
  {
    name: 'dates.list',
    description: 'List important dates with optional filtering by type or upcoming days',
    parameters: { type: 'object', properties: { type: { type: 'string' }, upcoming_days: { type: 'number' }, past: { type: 'boolean' } } },
    handler: (p) => ({ dates: getImportantDates(p), stats: getDateStats() }),
  },
  {
    name: 'dates.get',
    description: 'Get details for a specific important date',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    handler: ({ id }) => {
      const date = getImportantDate(id);
      return date || { error: 'Date not found' };
    },
  },
  {
    name: 'dates.update',
    description: 'Update an important date',
    parameters: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, date: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' }, recurring: { type: 'string' }, reminder_days_before: { type: 'number' }, notify: { type: 'boolean' } }, required: ['id'] },
    handler: ({ id, ...updates }) => { updateImportantDate(id, updates); return { success: true }; },
  },
  {
    name: 'dates.delete',
    description: 'Delete an important date',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    handler: ({ id }) => { deleteImportantDate(id); return { success: true }; },
  },
  {
    name: 'dates.upcoming_reminders',
    description: 'Get dates that are coming up and need attention/notification',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ reminders: getUpcomingReminders() }),
  },
  {
    name: 'dates.timeline',
    description: 'Get a timeline view of life events for a specific year or all time',
    parameters: { type: 'object', properties: { year: { type: 'number' } } },
    handler: ({ year }) => ({ events: getTimeline(year) }),
  },
];
