import { NextResponse } from 'next/server';
import { searchWeb, fetchAndSummarize } from '@/lib/search/web';

export async function POST(request) {
  try {
    const { query, url, max_results } = await request.json();

    if (url) {
      const result = await fetchAndSummarize(url);
      return NextResponse.json(result);
    }

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });
    const results = await searchWeb(query, max_results);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
