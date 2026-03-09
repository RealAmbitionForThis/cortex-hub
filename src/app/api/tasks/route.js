import { success, error, badRequest } from '@/lib/api/response';
import { addTask, listTasks, completeTask, updateTask, getBacklog, getOverdue, deleteTask } from '@/lib/tools/tasks/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'backlog') return success({ tasks: getBacklog() });
    if (view === 'overdue') return success({ tasks: getOverdue() });

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    return success({ tasks: listTasks({ status, priority }) });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title) return badRequest('Title required');
    const id = addTask(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;
    if (!id) return badRequest('Task ID required');
    if (action === 'complete') { completeTask(id); }
    else { updateTask(id, updates); }
    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    if (!body.id) return badRequest('Task ID required');
    deleteTask(body.id);
    return success();
  } catch (err) {
    return error(err.message);
  }
}
