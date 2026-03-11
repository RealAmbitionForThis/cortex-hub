import { getDb } from '@/lib/db';
import { generateEmbedding } from '@/lib/llm/provider';
import { cosineSimilarity, vectorToBuffer, bufferToVector } from '@/lib/memory/embeddings';
import { chunkText } from './parser';
import { v4 as uuidv4 } from 'uuid';

export async function indexDocument(documentId, text) {
  const db = getDb();
  const chunks = chunkText(text);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      const id = uuidv4();
      db.prepare(`
        INSERT INTO document_chunks (id, document_id, chunk_index, content, embedding)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, documentId, i, chunks[i], vectorToBuffer(embedding));
    } catch {
      // Skip chunks that fail to embed
    }
  }

  return chunks.length;
}

export async function searchDocuments(query, limit = 5) {
  const db = getDb();

  try {
    const queryEmbedding = await generateEmbedding(query);
    const chunks = db.prepare('SELECT * FROM document_chunks WHERE embedding IS NOT NULL').all();

    const scored = chunks.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, bufferToVector(chunk.embedding)),
    })).sort((a, b) => b.score - a.score).slice(0, limit);

    return scored.map(c => ({
      document_id: c.document_id,
      content: c.content,
      score: c.score,
      chunk_index: c.chunk_index,
    }));
  } catch {
    return [];
  }
}
