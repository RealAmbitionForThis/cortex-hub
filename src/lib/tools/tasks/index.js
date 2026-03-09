import { addTask, listTasks, completeTask, updateTask, getBacklog, getOverdue } from './queries';

export const taskTools = [
  {
    name: 'tasks.add',
    description: 'Create a new task',
    parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string' }, due_date: { type: 'string' }, module: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] },
    handler: (params) => { const id = addTask(params); return { success: true, id }; },
  },
  {
    name: 'tasks.list',
    description: 'List tasks with optional filters',
    parameters: { type: 'object', properties: { status: { type: 'string' }, priority: { type: 'string' }, module: { type: 'string' } } },
    handler: (params) => ({ tasks: listTasks(params) }),
  },
  {
    name: 'tasks.complete',
    description: 'Mark a task as completed',
    parameters: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
    handler: ({ task_id }) => { completeTask(task_id); return { success: true }; },
  },
  {
    name: 'tasks.update',
    description: 'Update a task',
    parameters: { type: 'object', properties: { task_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string' }, status: { type: 'string' }, due_date: { type: 'string' } }, required: ['task_id'] },
    handler: ({ task_id, ...updates }) => { updateTask(task_id, updates); return { success: true }; },
  },
  {
    name: 'tasks.get_backlog',
    description: 'Get all incomplete tasks sorted by priority',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ tasks: getBacklog() }),
  },
  {
    name: 'tasks.get_overdue',
    description: 'Get tasks past their due date',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ tasks: getOverdue() }),
  },
];
