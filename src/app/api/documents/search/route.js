import { NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/docs/rag';

export async function POST(request) {
  try {
    const { query, limit } = await request.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });
    const results = await searchDocuments(query, limit);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
