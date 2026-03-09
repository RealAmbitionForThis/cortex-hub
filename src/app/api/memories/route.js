import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { textToVector, vectorToBuffer } from '@/lib/memory/embeddings';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const moduleFilter = searchParams.get('module');

    let query = 'SELECT id, memory_type, category, module, content, confidence, protected, created_at, updated_at FROM memories WHERE 1=1';
    const params = [];

    if (type) { query += ' AND memory_type = ?'; params.push(type); }
    if (moduleFilter) { query += ' AND module = ?'; params.push(moduleFilter); }
    query += ' ORDER BY updated_at DESC LIMIT 200';

    const memories = db.prepare(query).all(...params);
    return NextResponse.json({ memories });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { content, category, module: memModule, memory_type, protected: isProtected } = body;

    const embedding = await textToVector(content);
    const id = uuidv4();

    db.prepare(
      'INSERT INTO memories (id, memory_type, category, module, content, embedding, protected, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
    ).run(id, memory_type || 'persistent', category || 'fact', memModule || 'general', content, embedding ? vectorToBuffer(embedding) : null, isProtected ? 1 : 0);

    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const { id } = await request.json();
    db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
