import { success, error, badRequest, notFound } from '@/lib/api/response';
import { getContacts, addContact, getContactById, updateContact, deleteContact, addInteraction, getInteractions, getUpcomingFollowups } from '@/lib/tools/contacts/queries';

export async function GET(request) {
  try {
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
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'interaction') {
      if (!body.contact_id) return badRequest('Contact ID required');
      const id = addInteraction(body);
      return success({ id });
    }
    if (!body.name) return badRequest('Name required');
    const id = addContact(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return badRequest('Contact ID required');
    updateContact(id, updates);
    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('Contact ID required');
    deleteContact(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
