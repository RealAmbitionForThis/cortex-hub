/**
 * @typedef {Object} ToolDefinition
 * @property {string} name
 * @property {string} description
 * @property {Object} parameters - JSON Schema
 * @property {Function} handler - async (params) => result
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} name
 * @property {Object} arguments
 */

/**
 * @typedef {Object} ToolResult
 * @property {string} tool_call_id
 * @property {string} name
 * @property {*} result
 * @property {string} [error]
 */
