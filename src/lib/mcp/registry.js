import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';

export function getMcpServers() {
  const db = getDb();
  return db.prepare('SELECT * FROM mcp_servers ORDER BY name ASC').all().map(s => ({
    ...s,
    enabled: Boolean(s.enabled),
    config: s.config ? JSON.parse(s.config) : {},
  }));
}

export function addMcpServer({ name, url, description, config }) {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO mcp_servers (id, name, url, description, enabled, config, created_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(id, name, url, description || null, config ? JSON.stringify(config) : null, new Date().toISOString());
  return id;
}

export function updateMcpServer(id, updates) {
  const db = getDb();
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'config') {
      fields.push('config = ?');
      params.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }
  params.push(id);
  db.prepare(`UPDATE mcp_servers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteMcpServer(id) {
  const db = getDb();
  db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(id);
}
