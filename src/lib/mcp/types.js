/**
 * @typedef {Object} McpServer
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} [description]
 * @property {boolean} enabled
 * @property {McpTool[]} tools
 */

/**
 * @typedef {Object} McpTool
 * @property {string} name
 * @property {string} description
 * @property {Object} parameters
 */

/**
 * @typedef {Object} McpMessage
 * @property {string} jsonrpc
 * @property {string} [method]
 * @property {*} [params]
 * @property {*} [result]
 * @property {number} [id]
 */

export {};
