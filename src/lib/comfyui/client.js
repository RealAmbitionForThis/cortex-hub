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

export async function getHistory(promptId) {
  const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getImage(filename, subfolder, type) {
  const params = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await fetch(`${COMFYUI_URL}/view?${params}`);
  if (!res.ok) throw new Error('Failed to fetch image');
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function uploadImage(imageBuffer, filename) {
  const formData = new FormData();
  const blob = new Blob([imageBuffer]);
  formData.append('image', blob, filename);

  const res = await fetch(`${COMFYUI_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}
