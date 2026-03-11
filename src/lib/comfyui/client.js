const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';

export async function isComfyUIRunning() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function getSystemStats() {
  const res = await fetch(`${COMFYUI_URL}/system_stats`);
  if (!res.ok) throw new Error('Failed to fetch system stats');
  return res.json();
}

export async function queueWorkflow(workflowJson, clientId) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflowJson, client_id: clientId }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Failed to queue workflow');
  }
  return res.json();
}
