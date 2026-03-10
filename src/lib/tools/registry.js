import { memoryTools } from './memory/index';
import { clusterTools } from './cluster/index';
import { moneyTools } from './money/index';
import { taskTools } from './tasks/index';
import { healthTools } from './health/index';
import { vehicleTools } from './vehicle/index';
import { contactTools } from './contacts/index';
import { docTools } from './docs/index';
import { notifyTools } from './notify/index';
import { searchTools } from './search/index';
import { exportTools } from './export/index';
import { scheduleTools } from './schedule/index';
import { calcTools } from './calc/index';
import { comfyuiTools } from './comfyui/index';
import { inventoryTools } from './inventory/index';
import { dateTools } from './dates/index';

const toolRegistry = new Map();

export function registerTools(tools) {
  for (const tool of tools) {
    toolRegistry.set(tool.name, tool);
  }
}

export function getToolDefinitions() {
  return Array.from(toolRegistry.values()).map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export function getToolByName(name) {
  return toolRegistry.get(name);
}

export async function executeTool(name, args) {
  // Sanitize tool name — models sometimes append junk tokens like <|channel|>commentary
  const cleanName = sanitizeToolName(name);
  const tool = toolRegistry.get(cleanName);
  if (!tool) {
    return { error: `Unknown tool: ${cleanName}` };
  }

  // Sanitize args — remove empty string values that break queries
  const cleanArgs = {};
  if (args && typeof args === 'object') {
    for (const [key, val] of Object.entries(args)) {
      // Skip empty keys and empty string values
      if (!key || key.trim() === '') continue;
      if (typeof val === 'string' && val.trim() === '') continue;
      cleanArgs[key] = val;
    }
  }

  try {
    const result = await tool.handler(cleanArgs);
    return result;
  } catch (error) {
    return { error: error.message || 'Tool execution failed' };
  }
}

function sanitizeToolName(name) {
  if (!name) return '';
  // Strip everything after common junk patterns models append
  let clean = name.replace(/<\|[^|]*\|>.*/g, '');
  // Strip any non-alphanumeric/dot/underscore characters from the end
  clean = clean.replace(/[^a-zA-Z0-9._]+$/, '');
  // Try to match against known tools if still not found
  if (!toolRegistry.has(clean)) {
    // Fuzzy match: find the tool whose name is a prefix of the dirty name
    for (const toolName of toolRegistry.keys()) {
      if (name.startsWith(toolName)) {
        return toolName;
      }
    }
  }
  return clean;
}

export function getAllToolNames() {
  return Array.from(toolRegistry.keys());
}

// Initialize with built-in tools
export function initializeTools() {
  registerTools(memoryTools);
  registerTools(clusterTools);
  registerTools(moneyTools);
  registerTools(taskTools);
  registerTools(healthTools);
  registerTools(vehicleTools);
  registerTools(contactTools);
  registerTools(docTools);
  registerTools(notifyTools);
  registerTools(searchTools);
  registerTools(exportTools);
  registerTools(scheduleTools);
  registerTools(calcTools);
  registerTools(comfyuiTools);
  registerTools(inventoryTools);
  registerTools(dateTools);
}

// Auto-initialize
initializeTools();
