import { listModels, checkConnection } from './provider';

export async function getAvailableModels() {
  try {
    const models = await listModels();
    return models.map((m) => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at,
    }));
  } catch {
    return [];
  }
}

export async function getOllamaStatus() {
  const connected = await checkConnection();
  if (!connected) {
    return { connected: false, models: [] };
  }
  const models = await getAvailableModels();
  return { connected: true, models };
}
