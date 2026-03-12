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
    const chunks = db.prepare(
      'SELECT id, document_id, chunk_index, content, embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 500'
    ).all();

    const scored = chunks.map(chunk => ({
      document_id: chunk.document_id,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      score: cosineSimilarity(queryEmbedding, bufferToVector(chunk.embedding)),
    })).sort((a, b) => b.score - a.score).slice(0, limit);

    return scored;
  } catch {
    return [];
  }
}
