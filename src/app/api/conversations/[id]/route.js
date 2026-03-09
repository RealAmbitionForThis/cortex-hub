import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(id);

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const sets = [];
    const values = [];

    if (body.title !== undefined) { sets.push('title = ?'); values.push(body.title); }
    if (body.pinned !== undefined) { sets.push('pinned = ?'); values.push(body.pinned); }
    if (body.model !== undefined) { sets.push('model = ?'); values.push(body.model); }

    if (sets.length > 0) {
      sets.push('updated_at = datetime(\'now\')');
      values.push(id);
      db.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
