import { success, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

export const GET = withHandler(async () => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value); }
    catch { settings[row.key] = row.value; }
  }
  return success({ settings });
});

const ALLOWED_SETTING_KEYS = new Set([
  // Backend
  'main_model', 'vision_model', 'embedding_model', 'cortex_backend',
  'ollama_url', 'llamacpp_url', 'llamacpp_binary_path', 'llamacpp_models', 'llamacpp_model_dirs',
  'cortex_embedding_url',
  // Integrations
  'comfyui_url', 'ntfy_url', 'ntfy_topic',
  'notify_bills', 'notify_tasks', 'notify_maintenance', 'notify_followups',
  // Memory
  'memory_interval', 'memory_retrieval_count', 'memory_threshold', 'auto_analyze', 'daily_log_time',
  // Extra-Analyze
  'extra_analyze_enabled', 'show_analyzer_panel', 'analysis_timeout',
  // Appearance
  'theme', 'accent_color', 'sidebar_default',
  // Exports & Documents
  'export_dir', 'doc_auto_index', 'doc_ocr', 'doc_scan_depth',
  // Chat defaults
  'reasoning_level', 'system_prompt',
  // Legacy individual sampling keys
  'num_ctx', 'temperature', 'top_p', 'top_k', 'repeat_penalty', 'seed',
  'min_p', 'tfs_z', 'mirostat', 'mirostat_tau', 'mirostat_eta',
]);

// Also allow any key prefixed with 'sampling_' for the ModelConfig sampling defaults
function isAllowedKey(key) {
  return ALLOWED_SETTING_KEYS.has(key) || key.startsWith('sampling_');
}

export const PUT = withHandler(async (request) => {
  const db = getDb();
  const body = await request.json();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))'
  );

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(body)) {
      if (!isAllowedKey(key)) continue;
      stmt.run(key, JSON.stringify(value));
    }
  });

  transaction();
  return success();
});
