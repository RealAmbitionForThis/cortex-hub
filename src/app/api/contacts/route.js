import { success, badRequest, notFound, withHandler } from '@/lib/api/response';
import { getContacts, addContact, getContactById, updateContact, deleteContact, addInteraction, getInteractions, getUpcomingFollowups } from '@/lib/tools/contacts/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const view = searchParams.get('view');

  if (view === 'followups') return success({ followups: getUpcomingFollowups() });

  if (id) {
    const contact = getContactById(id);
    if (!contact) return notFound('Contact not found');
    const interactions = getInteractions(id);
    return success({ contact, interactions });
  }

  const search = searchParams.get('search');
  const tag = searchParams.get('tag');
  return success({ contacts: getContacts({ search, tag }) });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (body.action === 'interaction') {
    if (!body.contact_id) return badRequest('Contact ID required');
    const id = addInteraction(body);
    return success({ id });
  }
  if (!body.name) return badRequest('Name required');
  const id = addContact(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return badRequest('Contact ID required');
  updateContact(id, updates);
  return success();
});

export const DELETE = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('Contact ID required');
  deleteContact(id);
  return success();
});
