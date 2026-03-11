import { listModels } from './provider';

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
