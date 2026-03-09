import { NextResponse } from 'next/server';
import { getContacts, addContact, getContactById, updateContact, deleteContact, addInteraction, getInteractions, getUpcomingFollowups } from '@/lib/tools/contacts/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const view = searchParams.get('view');

    if (view === 'followups') {
      return NextResponse.json({ followups: getUpcomingFollowups() });
    }

    if (id) {
      const contact = getContactById(id);
      if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const interactions = getInteractions(id);
      return NextResponse.json({ contact, interactions });
    }

    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    return NextResponse.json({ contacts: getContacts({ search, tag }) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'interaction') {
      const id = addInteraction(body);
      return NextResponse.json({ id, success: true });
    }
    const id = addContact(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    updateContact(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    deleteContact(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
