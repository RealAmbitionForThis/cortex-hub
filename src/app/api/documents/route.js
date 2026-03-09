import { NextResponse } from 'next/server';
import { getDocuments, addDocument, getDocumentById, deleteDocument } from '@/lib/tools/docs/queries';
import { indexDocument } from '@/lib/docs/rag';
import { extractTextFromPDF } from '@/lib/docs/parser';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const doc = getDocumentById(id);
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(doc);
    }
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    return NextResponse.json({ documents: getDocuments({ type, search }) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const title = formData.get('title') || file.name;

      const buffer = Buffer.from(await file.arrayBuffer());
      let content = '';

      if (file.name.endsWith('.pdf')) {
        const parsed = await extractTextFromPDF(buffer);
        content = parsed.text;
      } else {
        content = buffer.toString('utf-8');
      }

      const id = addDocument({ title, type: file.name.endsWith('.pdf') ? 'pdf' : 'text', content });
      indexDocument(id, content).catch(() => {});
      return NextResponse.json({ id, success: true });
    }

    const body = await request.json();
    const id = addDocument(body);
    if (body.content) indexDocument(id, body.content).catch(() => {});
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
