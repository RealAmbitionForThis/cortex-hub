import { success, error, badRequest } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import { spawn, execSync } from 'child_process';
import fs from 'fs';

// Module-level state — survives across requests, lost on server restart
let serverProcess = null;
let serverInfo = null;
let serverLog = [];
const MAX_LOG_LINES = 500;

function addLog(line) {
  serverLog.push(line);
  if (serverLog.length > MAX_LOG_LINES) serverLog.shift();
}

function findBinary() {
  // Check DB setting first
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'llamacpp_binary_path'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val && fs.existsSync(val)) return val;
    }
  } catch { /* fall through */ }

  // Check common locations
  const candidates = [
    'llama-server',
    '/usr/local/bin/llama-server',
    '/usr/bin/llama-server',
    `${process.env.HOME}/.local/bin/llama-server`,
    `${process.env.HOME}/llama.cpp/build/bin/llama-server`,
  ];

  for (const bin of candidates) {
    try {
      execSync(`which ${bin} 2>/dev/null || test -x ${bin}`, { timeout: 3000 });
      return bin;
    } catch { /* not found */ }
  }

  return null;
}

function buildArgs(modelPath, args) {
  const flags = ['-m', modelPath];

  // Essential
  if (args.ngl !== undefined && args.ngl !== '') flags.push('-ngl', String(args.ngl));
  if (args.ctx) flags.push('-c', String(args.ctx));
  if (args.port) flags.push('--port', String(args.port));
  if (args.host) flags.push('--host', args.host);
  if (args.fa) flags.push('-fa');
  if (args.np && args.np > 1) flags.push('-np', String(args.np));

  // Memory & Performance
  if (args.threads) flags.push('-t', String(args.threads));
  if (args.threadsBatch) flags.push('-tb', String(args.threadsBatch));
  if (args.batchSize) flags.push('-b', String(args.batchSize));
  if (args.ubatchSize) flags.push('-ub', String(args.ubatchSize));
  if (args.mlock) flags.push('--mlock');
  if (args.noMmap) flags.push('--no-mmap');
  if (args.numa && args.numa !== 'off') flags.push('--numa', args.numa);

  // GPU
  if (args.splitMode && args.splitMode !== 'layer') flags.push('-sm', args.splitMode);
  if (args.mainGpu !== undefined && args.mainGpu !== 0) flags.push('-mg', String(args.mainGpu));
  if (args.tensorSplit) flags.push('-ts', args.tensorSplit);

  // KV Cache
  if (args.cacheTypeK && args.cacheTypeK !== 'f16') flags.push('-ctk', args.cacheTypeK);
  if (args.cacheTypeV && args.cacheTypeV !== 'f16') flags.push('-ctv', args.cacheTypeV);

  // Network
  if (args.apiKey) flags.push('--api-key', args.apiKey);
  if (args.metrics) flags.push('--metrics');
  if (args.noWebui) flags.push('--no-webui');

  // Model & Template
  if (args.chatTemplate && args.chatTemplate !== 'auto') flags.push('--chat-template', args.chatTemplate);
  if (args.jinja) flags.push('--jinja');
  if (args.thinkMode && args.thinkMode !== 'none') flags.push('--think', args.thinkMode);
  if (args.lora) flags.push('--lora', args.lora);

  // Embedding
  if (args.embedding) flags.push('--embedding');
  if (args.pooling && args.pooling !== 'none') flags.push('--pooling', args.pooling);

  // RoPE
  if (args.ropeScaling && args.ropeScaling !== 'none') flags.push('--rope-scaling', args.ropeScaling);
  if (args.ropeFreqBase) flags.push('--rope-freq-base', String(args.ropeFreqBase));
  if (args.ropeFreqScale) flags.push('--rope-freq-scale', String(args.ropeFreqScale));

  return flags;
}

// GET — Check server status
export async function GET() {
  try {
    let running = false;
    if (serverProcess && serverInfo) {
      try {
        process.kill(serverProcess.pid, 0);
        running = true;
      } catch {
        running = false;
        serverProcess = null;
      }
    }

    return success({
      running,
      pid: running ? serverProcess?.pid : null,
      modelPath: serverInfo?.modelPath || null,
      port: serverInfo?.port || null,
      host: serverInfo?.host || null,
      startedAt: serverInfo?.startedAt || null,
      log: serverLog.slice(-100),
      binaryFound: !!findBinary(),
    });
  } catch (err) {
    return error(err.message);
  }
}

// POST — Launch llama-server
export async function POST(request) {
  try {
    const body = await request.json();
    const { modelPath, args = {} } = body;

    if (!modelPath) return badRequest('modelPath is required');

    // Check if already running
    if (serverProcess) {
      try {
        process.kill(serverProcess.pid, 0);
        return badRequest('Server is already running. Stop it first.');
      } catch {
        serverProcess = null;
      }
    }

    const binary = findBinary();
    if (!binary) {
      return badRequest(
        'llama-server binary not found. Install llama.cpp or set the binary path in settings.'
      );
    }

    const port = args.port || 8080;
    const host = args.host || '0.0.0.0';
    const cliArgs = buildArgs(modelPath, args);

    serverLog = [];
    addLog(`[cortex] Launching: ${binary} ${cliArgs.join(' ')}`);
    addLog(`[cortex] Port: ${port}, Host: ${host}`);

    const child = spawn(binary, cliArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    serverProcess = child;
    serverInfo = {
      modelPath,
      port,
      host,
      args,
      startedAt: new Date().toISOString(),
    };

    // Stream output via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        function sendEvent(data) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch { /* stream closed */ }
        }

        child.stdout.on('data', (data) => {
          const line = data.toString().trim();
          if (line) {
            addLog(line);
            sendEvent({ type: 'stdout', line });
          }
        });

        child.stderr.on('data', (data) => {
          const line = data.toString().trim();
          if (line) {
            addLog(line);
            sendEvent({ type: 'stderr', line });

            // Detect when server is ready
            if (line.includes('server is listening on') || line.includes('HTTP server listening')) {
              sendEvent({ type: 'ready', port, host });

              // Auto-update llamacpp_url setting
              try {
                const db = getDb();
                const url = `http://127.0.0.1:${port}`;
                db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(
                  'llamacpp_url', JSON.stringify(url)
                );
                addLog(`[cortex] Auto-configured llamacpp_url = ${url}`);
                sendEvent({ type: 'config_updated', llamacpp_url: url });
              } catch { /* non-critical */ }
            }
          }
        });

        child.on('error', (err) => {
          addLog(`[cortex] Process error: ${err.message}`);
          sendEvent({ type: 'error', message: err.message });
          serverProcess = null;
          controller.close();
        });

        child.on('exit', (code, signal) => {
          addLog(`[cortex] Process exited: code=${code}, signal=${signal}`);
          sendEvent({ type: 'exit', code, signal });
          serverProcess = null;
          controller.close();
        });

        // Close stream after 30 seconds regardless — client can poll status after
        setTimeout(() => {
          try { controller.close(); } catch { /* already closed */ }
        }, 30000);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return error(err.message);
  }
}

// DELETE — Stop llama-server
export async function DELETE() {
  try {
    if (!serverProcess) {
      return success({ stopped: true, message: 'No server running' });
    }

    const pid = serverProcess.pid;
    addLog(`[cortex] Stopping server (PID ${pid})...`);

    // Try SIGTERM first
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      serverProcess = null;
      return success({ stopped: true });
    }

    // Wait up to 5 seconds for graceful shutdown, then SIGKILL
    await new Promise((resolve) => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        try {
          process.kill(pid, 0);
          if (checks >= 10) {
            // Still alive after 5s, force kill
            try { process.kill(pid, 'SIGKILL'); } catch { /* */ }
            clearInterval(interval);
            resolve();
          }
        } catch {
          // Process is dead
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });

    addLog(`[cortex] Server stopped.`);
    serverProcess = null;

    return success({ stopped: true, pid });
  } catch (err) {
    return error(err.message);
  }
}
