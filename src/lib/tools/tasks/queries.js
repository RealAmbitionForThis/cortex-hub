import { getDb, updateRow } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function addTask({ title, description, priority, due_date, module: taskModule, tags }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO tasks (id, title, description, priority, status, module, due_date, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
  ).run(id, title, description || null, priority || 'medium', 'todo', taskModule || null, due_date || null, tags ? JSON.stringify(tags) : null);
  return id;
}

export function listTasks({ status, priority, module: taskModule } = {}) {
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (status && status.trim()) { query += ' AND status = ?'; params.push(status.trim()); }
  if (priority && priority.trim()) { query += ' AND priority = ?'; params.push(priority.trim()); }
  if (taskModule && taskModule.trim() && taskModule.trim() !== 'tasks') { query += ' AND module = ?'; params.push(taskModule.trim()); }
  query += ' ORDER BY CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, due_date ASC NULLS LAST';
  return getDb().prepare(query).all(...params);
}

export function completeTask(taskId) {
  getDb().prepare('UPDATE tasks SET status = ?, completed_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').run('done', taskId);
}

export function updateTask(taskId, updates) {
  updateRow('tasks', taskId, updates, ['title', 'description', 'priority', 'status', 'module', 'due_date', 'tags'], { serialize: ['tags'] });
}

export function getBacklog() {
  return getDb().prepare(
    'SELECT * FROM tasks WHERE status IN (\'todo\', \'in_progress\') ORDER BY CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, due_date ASC NULLS LAST'
  ).all();
}

export function getOverdue() {
  return getDb().prepare(
    'SELECT * FROM tasks WHERE status IN (\'todo\', \'in_progress\') AND due_date < date(\'now\') ORDER BY due_date ASC'
  ).all();
}

export function deleteTask(taskId) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}
