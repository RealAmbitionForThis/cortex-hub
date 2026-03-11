import { success, badRequest, withHandler } from '@/lib/api/response';
import { addTask, listTasks, completeTask, updateTask, getBacklog, getOverdue, deleteTask } from '@/lib/tools/tasks/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view === 'backlog') return success({ tasks: getBacklog() });
  if (view === 'overdue') return success({ tasks: getOverdue() });

  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  return success({ tasks: listTasks({ status, priority }) });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (!body.title) return badRequest('Title required');
  const id = addTask(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  const { id, action, ...updates } = body;
  if (!id) return badRequest('Task ID required');
  if (action === 'complete') { completeTask(id); }
  else { updateTask(id, updates); }
  return success();
});

export const DELETE = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Task ID required');
  deleteTask(body.id);
  return success();
});
