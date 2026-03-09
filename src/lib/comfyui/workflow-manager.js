export function applyParameters(workflowJson, params) {
  const workflow = JSON.parse(JSON.stringify(workflowJson));

  if (!params || !Array.isArray(params)) return workflow;

  for (const param of params) {
    const { node_id, field, value } = param;
    if (workflow[node_id] && workflow[node_id].inputs) {
      let finalValue = value;
      if (field === 'seed' && value === -1) {
        finalValue = Math.floor(Math.random() * 2147483647);
      }
      workflow[node_id].inputs[field] = finalValue;
    }
  }

  return workflow;
}

const EXTRACTABLE_NODES = {
  CLIPTextEncode: [
    { field: 'text', label: 'Prompt Text', type: 'string' },
  ],
  KSampler: [
    { field: 'seed', label: 'Seed', type: 'number' },
    { field: 'steps', label: 'Steps', type: 'number' },
    { field: 'cfg', label: 'CFG Scale', type: 'number' },
    { field: 'sampler_name', label: 'Sampler', type: 'string' },
  ],
  EmptyLatentImage: [
    { field: 'width', label: 'Width', type: 'number' },
    { field: 'height', label: 'Height', type: 'number' },
  ],
  CheckpointLoaderSimple: [
    { field: 'ckpt_name', label: 'Checkpoint', type: 'string' },
  ],
};

export function extractParameters(workflowJson) {
  const workflow = typeof workflowJson === 'string' ? JSON.parse(workflowJson) : workflowJson;
  const parameters = [];

  for (const nodeId of Object.keys(workflow)) {
    const node = workflow[nodeId];
    const classType = node.class_type;
    const fields = EXTRACTABLE_NODES[classType];

    if (!fields) continue;

    for (const fieldDef of fields) {
      const defaultValue = node.inputs?.[fieldDef.field];
      if (defaultValue === undefined) continue;
      // Skip inputs that are links (arrays like [nodeId, outputIndex])
      if (Array.isArray(defaultValue)) continue;

      let label = fieldDef.label;
      // Add node title if available for disambiguation
      if (node._meta?.title) {
        label = `${node._meta.title} - ${fieldDef.label}`;
      }

      parameters.push({
        node_id: nodeId,
        field: fieldDef.field,
        label,
        type: fieldDef.type,
        default: defaultValue,
      });
    }
  }

  return parameters;
}
