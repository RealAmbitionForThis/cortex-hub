import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function getAllClusters() {
  return getDb().prepare('SELECT * FROM clusters ORDER BY name').all();
}

export function getClusterById(id) {
  return getDb().prepare('SELECT * FROM clusters WHERE id = ?').get(id);
}

export function createCluster({ name, description, icon, color, system_prompt_addition }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO clusters (id, name, description, system_prompt_addition, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
  ).run(id, name, description || null, system_prompt_addition || null, icon || '📁', color || '#6366f1');
  return id;
}

export function updateCluster(id, updates) {
  const db = getDb();
  const ALLOWED = ['name', 'description', 'system_prompt_addition', 'icon', 'color', 'active'];
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED.includes(key)) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  fields.push('updated_at = datetime(\'now\')');
  values.push(id);
  db.prepare(`UPDATE clusters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteCluster(id) {
  getDb().prepare('DELETE FROM clusters WHERE id = ?').run(id);
}

export function addClusterMemory(clusterId, content) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO cluster_memories (id, cluster_id, content, created_at) VALUES (?, ?, ?, datetime(\'now\'))'
  ).run(id, clusterId, content);
  return id;
}

export function getClusterMemories(clusterId) {
  return getDb().prepare('SELECT * FROM cluster_memories WHERE cluster_id = ?').all(clusterId);
}
