import { getDb } from '@/lib/db';
import { textToVector, cosineSimilarity, bufferToVector } from './embeddings';
import { DEFAULT_MEMORY_RETRIEVAL_COUNT } from '@/lib/constants';

export async function retrieveRelevantMemories({ query, module, limit, clusterIds = [] }) {
  const count = limit || DEFAULT_MEMORY_RETRIEVAL_COUNT;
  const queryVector = await textToVector(query);

  const globalMemories = getGlobalMemories(module);
  const clusterMemories = getClusterMemories(clusterIds);
  const allMemories = [...globalMemories, ...clusterMemories];

  if (!queryVector) {
    return allMemories.slice(0, count);
  }

  return rankBySimilarity(allMemories, queryVector, count);
}

function getGlobalMemories(module) {
  const db = getDb();
  let query = 'SELECT * FROM memories WHERE confidence > 0.3';
  const params = [];

  if (module) {
    query += ' AND (module = ? OR module = \'general\')';
    params.push(module);
  }

  query += ' ORDER BY updated_at DESC LIMIT 100';
  return db.prepare(query).all(...params);
}

function getClusterMemories(clusterIds) {
  if (!clusterIds.length) return [];
  const db = getDb();
  const placeholders = clusterIds.map(() => '?').join(',');
  return db.prepare(
    `SELECT * FROM cluster_memories WHERE cluster_id IN (${placeholders})`
  ).all(...clusterIds);
}

function rankBySimilarity(memories, queryVector, limit) {
  const scored = memories.map((m) => {
    const memVector = m.embedding ? bufferToVector(m.embedding) : null;
    const similarity = memVector ? cosineSimilarity(queryVector, memVector) : 0;
    return { ...m, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}
