import { getDb } from '@/lib/db';
import { chatCompletion } from '@/lib/llm/provider';
import { textToVector, vectorToBuffer } from './embeddings';
import { v4 as uuidv4 } from 'uuid';
import { parseJsonSafe } from '@/lib/utils/format';
import { toISODate } from '@/lib/utils/date';

const DAILY_LOG_PROMPT = `Summarize today's conversations into a daily log.
Include: key topics discussed, decisions made, important events, tasks created, money spent, mood.
Be concise — 3-5 sentences for the summary, then bullet points for highlights.

Messages:
{messages}

Return JSON:
{
  "summary": "3-5 sentence summary",
  "topics": ["topic1", "topic2"],
  "highlights": ["highlight1", "highlight2"],
  "mood": "overall mood"
}`;

export async function generateDailyLog() {
  const db = getDb();
  const today = toISODate();

  const existing = db.prepare('SELECT id FROM daily_logs WHERE date = ?').get(today);
  if (existing) return;

  const messages = db.prepare(
    'SELECT m.role, m.content FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE date(m.created_at) = ? ORDER BY m.created_at'
  ).all(today);

  if (messages.length < 2) return;

  const messageText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const prompt = DAILY_LOG_PROMPT.replace('{messages}', messageText);
  const model = process.env.CORTEX_DEFAULT_MAIN_MODEL || 'gpt-oss:20b';

  try {
    const res = await chatCompletion({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    const data = await res.json();
    const content = data.message?.content || '';
    const parsed = parseJsonSafe(content, {});
    const embedding = await textToVector(parsed.summary || content);

    db.prepare(
      'INSERT INTO daily_logs (id, date, summary, topics, modules_touched, message_count, mood, highlights, embedding, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
    ).run(
      uuidv4(), today, parsed.summary || content,
      JSON.stringify(parsed.topics || []),
      JSON.stringify([]),
      messages.length,
      parsed.mood || 'neutral',
      JSON.stringify(parsed.highlights || []),
      embedding ? vectorToBuffer(embedding) : null
    );
  } catch {
    // Daily log generation failed silently
  }
}
