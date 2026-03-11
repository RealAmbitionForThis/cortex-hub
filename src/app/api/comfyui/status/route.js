import { success, withHandler } from '@/lib/api/response';
import { isComfyUIRunning, getSystemStats } from '@/lib/comfyui/client';

export const GET = withHandler(async () => {
  const connected = await isComfyUIRunning();
  let system_stats = null;

  if (connected) {
    try {
      system_stats = await getSystemStats();
    } catch {
      // Connected but stats unavailable
    }
  }

  return success({ connected, system_stats });
});
