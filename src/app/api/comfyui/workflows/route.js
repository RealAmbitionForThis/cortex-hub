import { success, error, badRequest } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { extractParameters } from '@/lib/comfyui/workflow-manager';

function parseWorkflow(row) {
  return {
    ...row,
    workflow_json: row.workflow_json ? JSON.parse(row.workflow_json) : null,
    parameters: row.parameters ? JSON.parse(row.parameters) : [],
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM comfyui_workflows ORDER BY updated_at DESC').all();
    const workflows = rows.map(parseWorkflow);
    return success({ workflows });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name) return badRequest('Name is required');
    if (!body.workflow_json) return badRequest('Workflow JSON is required');

    const workflowJson = typeof body.workflow_json === 'string'
      ? JSON.parse(body.workflow_json)
      : body.workflow_json;

    const parameters = extractParameters(workflowJson);
    const id = uuid();
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
  } catch (err) {
    return error(err.message);
  }
}
