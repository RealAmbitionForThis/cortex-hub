import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export const POST = withHandler(async (request) => {
  const db = getDb();
  const { messageId, reasoningLevel } = await request.json();

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  if (!msg || msg.role !== 'assistant') {
    return badRequest('Invalid message');
  }

  db.prepare('DELETE FROM messages WHERE conversation_id = ? AND created_at >= ?')
    .run(msg.conversation_id, msg.created_at);

  return success({
    conversationId: msg.conversation_id,
    reasoningLevel: reasoningLevel || msg.reasoning_level,
  });
});
