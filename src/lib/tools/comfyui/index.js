import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { applyParameters, extractParameters } from '@/lib/comfyui/workflow-manager';
import { queueWorkflow } from '@/lib/comfyui/client';
import { parseTags, parseJsonSafe } from '@/lib/utils/format';

export const comfyuiTools = [
  {
    name: 'comfyui.list_workflows',
    description: 'List all saved ComfyUI workflows',
    parameters: { type: 'object', properties: {} },
    handler: () => {
      const db = getDb();
      const rows = db.prepare('SELECT id, name, description, tags, use_count, last_used FROM comfyui_workflows ORDER BY updated_at DESC').all();
      return {
        workflows: rows.map((r) => ({
          ...r,
          tags: parseTags(r.tags),
        })),
      };
    },
  },
  {
    name: 'comfyui.run_workflow',
    description: 'Queue a ComfyUI workflow for image generation with optional parameter overrides',
    parameters: {
      type: 'object',
      properties: {
        workflow_id: { type: 'string', description: 'ID of the saved workflow' },
        params: {
          type: 'array',
          description: 'Parameter overrides: [{node_id, field, value}]',
          items: {
            type: 'object',
            properties: {
              node_id: { type: 'string' },
              field: { type: 'string' },
              value: {},
            },
          },
        },
      },
      required: ['workflow_id'],
    },
    handler: async ({ workflow_id, params }) => {
      const db = getDb();
      const workflow = db.prepare('SELECT * FROM comfyui_workflows WHERE id = ?').get(workflow_id);
      if (!workflow) return { error: 'Workflow not found' };

      let workflowJson;
      try { workflowJson = JSON.parse(workflow.workflow_json); } catch (e) { return { error: 'Invalid workflow JSON: ' + e.message }; }
      const modifiedWorkflow = applyParameters(workflowJson, params || []);

      const clientId = uuidv4();
      const result = await queueWorkflow(modifiedWorkflow, clientId);
      const promptId = result?.prompt_id;

      const generationId = uuidv4();
      db.prepare(`
        INSERT INTO comfyui_generations (id, workflow_id, prompt_id, input_params, status)
        VALUES (?, ?, ?, ?, 'queued')
      `).run(generationId, workflow_id, promptId, JSON.stringify(params || []));

      db.prepare(`
        UPDATE comfyui_workflows
        SET use_count = use_count + 1, last_used = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(workflow_id);

      return { success: true, generation_id: generationId, prompt_id: promptId };
    },
  },
  {
    name: 'comfyui.get_workflow_params',
    description: 'Get the editable parameters for a ComfyUI workflow',
    parameters: {
      type: 'object',
      properties: {
        workflow_id: { type: 'string', description: 'ID of the saved workflow' },
      },
      required: ['workflow_id'],
    },
    handler: ({ workflow_id }) => {
      const db = getDb();
      const workflow = db.prepare('SELECT name, parameters, workflow_json FROM comfyui_workflows WHERE id = ?').get(workflow_id);
      if (!workflow) return { error: 'Workflow not found' };

      let parameters = parseJsonSafe(workflow.parameters, []);
      if (parameters.length === 0 && workflow.workflow_json) {
        try { parameters = extractParameters(JSON.parse(workflow.workflow_json)); } catch { /* malformed workflow JSON */ }
      }

      return { workflow_name: workflow.name, parameters };
    },
  },
];
