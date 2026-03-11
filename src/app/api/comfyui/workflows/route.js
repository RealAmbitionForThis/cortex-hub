import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { extractParameters } from '@/lib/comfyui/workflow-manager';
import { parseWorkflow } from '@/lib/comfyui/parse';

export const GET = withHandler(async () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM comfyui_workflows ORDER BY updated_at DESC').all();
  const workflows = rows.map(parseWorkflow);
  return success({ workflows });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (!body.name) return badRequest('Name is required');
  if (!body.workflow_json) return badRequest('Workflow JSON is required');

  let workflowJson;
  try {
    workflowJson = typeof body.workflow_json === 'string'
      ? JSON.parse(body.workflow_json)
      : body.workflow_json;
  } catch (e) {
    return badRequest('Invalid workflow JSON: ' + e.message);
  }

  const parameters = extractParameters(workflowJson);
  const id = uuidv4();
  const db = getDb();

  db.prepare(`
    INSERT INTO comfyui_workflows (id, name, description, workflow_json, parameters, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.name,
    body.description || null,
    JSON.stringify(workflowJson),
    JSON.stringify(parameters),
    JSON.stringify(body.tags || []),
  );

  return success({ id, parameters }, 201);
});
