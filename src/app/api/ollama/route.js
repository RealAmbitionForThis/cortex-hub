import { NextResponse } from 'next/server';
import { getOllamaStatus } from '@/lib/llm/models';

export async function GET() {
  try {
    const status = await getOllamaStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ connected: false, models: [] });
  }
}
