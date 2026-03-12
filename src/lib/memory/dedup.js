import { getDb } from '@/lib/db';
import { cosineSimilarity, bufferToVector } from './embeddings';
import { MEMORY_SIMILARITY_THRESHOLD } from '@/lib/constants';

export function findSimilarMemory(embedding, threshold) {
  const db = getDb();
  const memories = db.prepare('SELECT * FROM memories WHERE embedding IS NOT NULL ORDER BY updated_at DESC LIMIT 500').all();
  const cutoff = threshold || MEMORY_SIMILARITY_THRESHOLD;

  for (const memory of memories) {
    const memVector = bufferToVector(memory.embedding);
    if (!memVector) continue;

    const similarity = cosineSimilarity(embedding, memVector);
    if (similarity >= cutoff) {
      return { memory, similarity };
    }
  }

  return null;
}

export function shouldUpdate(existingMemory, newContent) {
  if (existingMemory.protected) return false;
  return existingMemory.content !== newContent;
}
