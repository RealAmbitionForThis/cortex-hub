import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const conversations = db.prepare(
      'SELECT * FROM conversations ORDER BY pinned DESC, updated_at DESC LIMIT 100'
    ).all();
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();
    const model = body.model || process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b';

    db.prepare(
      'INSERT INTO conversations (id, title, model, cluster_id, reasoning_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
    ).run(id, body.title || 'New Chat', model, body.cluster_id || null, body.reasoning_level || 'medium');

    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const { id } = await request.json();
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
