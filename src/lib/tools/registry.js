import { memoryTools } from './memory/index';
import { clusterTools } from './cluster/index';
import { moneyTools } from './money/index';
import { taskTools } from './tasks/index';
import { healthTools } from './health/index';
import { vehicleTools } from './vehicle/index';

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
  const tool = toolRegistry.get(name);
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    const result = await tool.handler(args);
    return result;
  } catch (error) {
    return { error: error.message || 'Tool execution failed' };
  }
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
}

// Auto-initialize
initializeTools();
