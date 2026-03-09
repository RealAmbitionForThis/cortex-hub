import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return { text: data.text, pages: data.numpages, info: data.info };
  } catch (error) {
    return { text: '', pages: 0, error: error.message };
  }
}

export function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) chunks.push(chunk);
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}
