import { NextResponse } from 'next/server';
import { getClusterById, updateCluster, deleteCluster } from '@/lib/tools/cluster/queries';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cluster = getClusterById(id);
    if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ cluster });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    updateCluster(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    deleteCluster(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
