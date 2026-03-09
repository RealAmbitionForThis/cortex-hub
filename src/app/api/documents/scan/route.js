import { NextResponse } from 'next/server';
import { scanDocument } from '@/lib/docs/scanner';
import { addDocument } from '@/lib/tools/docs/queries';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'receipt';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const result = await scanDocument(base64, type);

    if (!result.error) {
      const title = result.store || result.title || `Scanned ${type}`;
      const id = addDocument({ title, type: 'receipt', content: JSON.stringify(result), metadata: result });
      return NextResponse.json({ id, result, success: true });
    }

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
