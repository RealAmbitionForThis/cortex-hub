import { NextResponse } from 'next/server';
import { addTask, listTasks, completeTask, updateTask, getBacklog, getOverdue, deleteTask } from '@/lib/tools/tasks/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'backlog') return NextResponse.json({ tasks: getBacklog() });
    if (view === 'overdue') return NextResponse.json({ tasks: getOverdue() });

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    return NextResponse.json({ tasks: listTasks({ status, priority }) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = addTask(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;
    if (action === 'complete') { completeTask(id); }
    else { updateTask(id, updates); }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
