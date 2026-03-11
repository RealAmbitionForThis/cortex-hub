import { success, error, badRequest, notFound, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { applyParameters } from '@/lib/comfyui/workflow-manager';
import { queueWorkflow } from '@/lib/comfyui/client';

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (!body.workflow_id) return badRequest('workflow_id is required');

  const db = getDb();
  const workflow = db.prepare('SELECT * FROM comfyui_workflows WHERE id = ?').get(body.workflow_id);
  if (!workflow) return notFound('Workflow not found');

  let workflowJson;
  try { workflowJson = JSON.parse(workflow.workflow_json); } catch (e) { return error('Invalid workflow JSON: ' + e.message); }
  const modifiedWorkflow = applyParameters(workflowJson, body.params || []);

  const clientId = uuidv4();
  const result = await queueWorkflow(modifiedWorkflow, clientId);
  const promptId = result?.prompt_id;

  const generationId = uuidv4();
  db.prepare(`
    INSERT INTO comfyui_generations (id, workflow_id, prompt_id, input_params, status)
    VALUES (?, ?, ?, ?, 'queued')
  `).run(
    generationId,
    body.workflow_id,
    promptId,
    JSON.stringify(body.params || []),
  );

  // Update workflow use count and last_used
  db.prepare(`
    UPDATE comfyui_workflows
    SET use_count = use_count + 1, last_used = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(body.workflow_id);

  return success({ generation_id: generationId, prompt_id: promptId });
});
