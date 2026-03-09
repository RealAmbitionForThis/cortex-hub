import { success, error, badRequest, notFound } from '@/lib/api/response';
import { getDocuments, addDocument, getDocumentById, deleteDocument } from '@/lib/tools/docs/queries';
import { indexDocument } from '@/lib/docs/rag';
import { extractTextFromPDF } from '@/lib/docs/parser';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const doc = getDocumentById(id);
      if (!doc) return notFound('Document not found');
      return success({ document: doc });
    }
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    return success({ documents: getDocuments({ type, search }) });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return badRequest('No file provided');
      const title = formData.get('title') || file.name;

      const buffer = Buffer.from(await file.arrayBuffer());
      let content = '';
      const isPdf = file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const parsed = await extractTextFromPDF(buffer);
        content = parsed.text;
      } else {
        content = buffer.toString('utf-8');
      }

      const id = addDocument({ title, type: isPdf ? 'pdf' : 'text', content });
      indexDocument(id, content).catch(() => {});
      return success({ id });
    }

    const body = await request.json();
    if (!body.title) return badRequest('Title required');
    const id = addDocument(body);
    if (body.content) indexDocument(id, body.content).catch(() => {});
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('Document ID required');
    deleteDocument(id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
