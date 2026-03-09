import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const db = getDb();
    const { messageId, reasoningLevel } = await request.json();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!msg || msg.role !== 'assistant') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Delete this assistant message and any after it
    db.prepare('DELETE FROM messages WHERE conversation_id = ? AND created_at >= ?')
      .run(msg.conversation_id, msg.created_at);

    return NextResponse.json({
      success: true,
      conversationId: msg.conversation_id,
      reasoningLevel: reasoningLevel || msg.reasoning_level,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
