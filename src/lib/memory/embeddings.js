import { generateEmbedding } from '@/lib/llm/provider';

export async function textToVector(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return await generateEmbedding(text);
  } catch {
    return null;
  }
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function vectorToBuffer(vector) {
  return Buffer.from(new Float32Array(vector).buffer);
}

export function bufferToVector(buffer) {
  if (!buffer) return null;
  return Array.from(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4));
}
