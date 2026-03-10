import * as ollama from './client';
import * as llamacpp from './llamacpp';

export function getBackend() {
  return (process.env.CORTEX_BACKEND || 'ollama').toLowerCase();
}

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
