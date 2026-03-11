import { getDb } from '@/lib/db';

/**
 * Resolve the active backend type from DB settings, falling back to env var.
 */
export function resolveBackend() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'cortex_backend'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val === 'llamacpp' || val === 'ollama') return val;
    }
  } catch { /* DB not ready, fall back to env */ }
  return (process.env.CORTEX_BACKEND || 'ollama').toLowerCase();
}

/**
 * Resolve the Ollama URL from DB settings, falling back to env var.
 */
export function resolveOllamaUrl() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'ollama_url'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val) return val;
    }
  } catch { /* fall back to env */ }
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}

/**
 * Resolve the llama-server URL from DB settings, falling back to env var.
 */
export function resolveLlamacppUrl() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'llamacpp_url'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val) return val;
    }
  } catch { /* fall back to env */ }
  return process.env.LLAMACPP_URL || 'http://localhost:8080';
}

/**
 * Resolve the embedding fallback URL from DB settings, falling back to env var.
 */
export function resolveEmbeddingUrl() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'cortex_embedding_url'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val) return val;
    }
  } catch { /* fall back to env */ }
  return process.env.CORTEX_EMBEDDING_URL || '';
}
