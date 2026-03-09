import { addContact, getContacts, getContactById, updateContact, deleteContact, addInteraction, getInteractions } from './queries';

export const contactTools = [
  {
    name: 'contacts.add',
    description: 'Add a new contact',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Contact name' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        role: { type: 'string' },
        notes: { type: 'string' },
        birthday: { type: 'string', description: 'YYYY-MM-DD' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name'],
    },
    handler: async (args) => {
      const id = addContact(args);
      return { success: true, id };
    },
  },
  {
    name: 'contacts.search',
    description: 'Search contacts by name, email, company, or tag',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        tag: { type: 'string' },
      },
    },
    handler: async (args) => ({ contacts: getContacts(args) }),
  },
  {
    name: 'contacts.get',
    description: 'Get a contact by ID with their interactions',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async ({ id }) => {
      const contact = getContactById(id);
      if (!contact) return { error: 'Contact not found' };
      const interactions = getInteractions(id);
      return { contact, interactions };
    },
  },
  {
    name: 'contacts.update',
    description: 'Update a contact',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        role: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
    handler: async ({ id, ...updates }) => {
      updateContact(id, updates);
      return { success: true };
    },
  },
  {
    name: 'contacts.delete',
    description: 'Delete a contact',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async ({ id }) => {
      deleteContact(id);
      return { success: true };
    },
  },
  {
    name: 'contacts.log_interaction',
    description: 'Log an interaction with a contact (call, meeting, email, note, followup)',
    parameters: {
      type: 'object',
      properties: {
        contact_id: { type: 'string' },
        type: { type: 'string', enum: ['call', 'meeting', 'email', 'note', 'followup'] },
        notes: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['contact_id'],
    },
    handler: async (args) => {
      const id = addInteraction(args);
      return { success: true, id };
    },
  },
];
