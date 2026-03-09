import { NextResponse } from 'next/server';
import { getAllClusters, createCluster } from '@/lib/tools/cluster/queries';

export async function GET() {
  try {
    return NextResponse.json({ clusters: getAllClusters() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = createCluster(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
