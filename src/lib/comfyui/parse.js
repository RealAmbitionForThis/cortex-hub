import { parseJsonSafe } from '@/lib/utils/format';

export function parseWorkflow(row) {
  return {
    ...row,
    workflow_json: parseJsonSafe(row.workflow_json, null),
    parameters: parseJsonSafe(row.parameters, []),
    tags: parseJsonSafe(row.tags, []),
  };
}
