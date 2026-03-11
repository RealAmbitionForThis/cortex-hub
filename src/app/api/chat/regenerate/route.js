import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export const POST = withHandler(async (request) => {
  const db = getDb();
  const { messageId, reasoningLevel } = await request.json();

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  if (!msg || msg.role !== 'assistant') {
    return badRequest('Invalid message');
  }

  // Delete this specific message + all messages strictly after it.
  // Using (id = target OR created_at > target) avoids deleting other messages
  // that happen to share the same created_at second (e.g. during rapid tool call rounds).
  db.prepare('DELETE FROM messages WHERE conversation_id = ? AND (id = ? OR created_at > ?)')
    .run(msg.conversation_id, msg.id, msg.created_at);

  return success({
    conversationId: msg.conversation_id,
    reasoningLevel: reasoningLevel || msg.reasoning_level,
  });
});
