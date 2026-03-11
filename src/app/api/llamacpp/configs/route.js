import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';

const SETTINGS_KEY = 'llamacpp_launch_configs';

function getConfigs() {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(SETTINGS_KEY);
  if (!row) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

function saveConfigs(configs) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(
    SETTINGS_KEY, JSON.stringify(configs)
  );
}

// GET — List all saved configs
export const GET = withHandler(async () => {
  return success({ configs: getConfigs() });
});

// POST — Save a new config
export const POST = withHandler(async (request) => {
  const body = await request.json();
  const { name, modelPath, args } = body;

  if (!name) return badRequest('Config name is required');

  const configs = getConfigs();

  // Replace existing config with same name, or add new
  const idx = configs.findIndex((c) => c.name === name);
  const config = { name, modelPath, args, savedAt: new Date().toISOString() };

  if (idx >= 0) {
    configs[idx] = config;
  } else {
    configs.push(config);
  }

  saveConfigs(configs);
  return success({ config });
});

// DELETE — Delete a config by name
export const DELETE = withHandler(async (request) => {
  const body = await request.json();
  const { name } = body;

  if (!name) return badRequest('Config name is required');

  const configs = getConfigs().filter((c) => c.name !== name);
  saveConfigs(configs);

  return success({ deleted: name });
});
