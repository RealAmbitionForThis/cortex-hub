import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseJsonSafe } from '@/lib/utils/format';

export function getMcpServers() {
  const db = getDb();
  return db.prepare('SELECT * FROM mcp_servers ORDER BY name ASC').all().map(s => ({
    ...s,
    enabled: Boolean(s.enabled),
    config: parseJsonSafe(s.config, {}),
  }));
}

export function addMcpServer({ name, url, description, config }) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO mcp_servers (id, name, url, description, enabled, config, created_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(id, name, url, description || null, config ? JSON.stringify(config) : null, new Date().toISOString());
  return id;
}

export function updateMcpServer(id, updates) {
  const db = getDb();
  const ALLOWED = ['name', 'url', 'description', 'enabled', 'config'];
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED.includes(key)) continue;
    if (key === 'config') {
      fields.push('config = ?');
      params.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }
  if (fields.length === 0) return;
  params.push(id);
  db.prepare(`UPDATE mcp_servers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteMcpServer(id) {
  const db = getDb();
  db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(id);
}
