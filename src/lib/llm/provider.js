import * as ollama from './client';
import * as llamacpp from './llamacpp';
import { resolveBackend, resolveOllamaUrl, resolveLlamacppUrl } from './urls';

export function getBackend() {
  return resolveBackend();
}

// Re-export URL resolvers for use by API routes
export { resolveOllamaUrl, resolveLlamacppUrl };

function getClient() {
  return getBackend() === 'llamacpp' ? llamacpp : ollama;
}

export function chatCompletion(opts) {
  return getClient().chatCompletion(opts);
}

export function generateCompletion(opts) {
  return getClient().generateCompletion(opts);
}

export function generateEmbedding(text, model) {
  return getClient().generateEmbedding(text, model);
}

export function listModels() {
  return getClient().listModels();
}

export function showModel(modelName) {
  return getClient().showModel(modelName);
}

export function checkConnection() {
  return getClient().checkConnection();
}
