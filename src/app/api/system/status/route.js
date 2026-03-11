import { success, error } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { resolveOllamaUrl } from '@/lib/llm/urls';
import { execSync } from 'child_process';
import fs from 'fs';

const APP_START_TIME = Date.now();

export async function GET() {
  try {
    const ollamaUrl = resolveOllamaUrl();

    // Ollama status
    let ollama = { connected: false, loaded_models: [], total_vram_used_mb: 0 };
    try {
      const res = await fetch(`${ollamaUrl}/api/ps`);
      if (res.ok) {
        const data = await res.json();
        ollama = {
          connected: true,
          url: ollamaUrl,
          loaded_models: (data.models || []).map(m => ({
            name: m.name,
            size_vram_mb: Math.round((m.size_vram || 0) / 1048576),
            expires_at: m.expires_at,
          })),
          total_vram_used_mb: Math.round((data.models || []).reduce((sum, m) => sum + (m.size_vram || 0), 0) / 1048576),
        };
      }
    } catch (e) { console.error('[system/status] Ollama check failed:', e.message); }

    // GPU info via nvidia-smi
    let gpu = null;
    try {
      const output = execSync('nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu --format=csv,noheader,nounits', { timeout: 5000 }).toString().trim();
      const parts = output.split(', ').map(s => s.trim());
      gpu = {
        name: parts[0] || 'Unknown',
        vram_total_mb: parseInt(parts[1]) || 0,
        vram_used_mb: parseInt(parts[2]) || 0,
        vram_free_mb: parseInt(parts[3]) || 0,
        utilization_percent: parseInt(parts[4]) || 0,
      };
    } catch { /* nvidia-smi not available */ }

    // Cortex stats
    const db = getDb();
    const dbPath = process.env.CORTEX_DB_PATH || './cortex.db';
    let dbSizeMb = 0;
    try { dbSizeMb = Math.round(fs.statSync(dbPath).size / 1048576 * 10) / 10; } catch {}

    const memoryCount = db.prepare('SELECT COUNT(*) as c FROM memories').get()?.c ?? 0;
    const conversationCount = db.prepare('SELECT COUNT(*) as c FROM conversations').get()?.c ?? 0;
    const taskCountActive = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status != 'done'").get()?.c ?? 0;

    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const billsDueSoon = db.prepare('SELECT COUNT(*) as c FROM bills WHERE next_due BETWEEN ? AND ?').get(today, threeDaysLater)?.c ?? 0;

    const cortex = {
      db_size_mb: dbSizeMb,
      memory_count: memoryCount,
      conversation_count: conversationCount,
      task_count_active: taskCountActive,
      bills_due_soon: billsDueSoon,
      uptime_seconds: Math.round((Date.now() - APP_START_TIME) / 1000),
    };

    // ntfy status
    const ntfyTopic = process.env.CORTEX_NTFY_TOPIC;
    const lastNotification = db.prepare('SELECT created_at FROM notifications ORDER BY created_at DESC LIMIT 1').get();
    const ntfy = {
      configured: !!ntfyTopic,
      last_sent: lastNotification?.created_at || null,
    };

    return success({ ollama, gpu, cortex, ntfy });
  } catch (err) {
    return error(err.message);
  }
}
