'use client';

import { useState, useEffect, useCallback } from 'react';

export function useBackendStatus() {
  const [connected, setConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backend/status');
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        setModels(data.models || []);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { connected, models, loading, refresh };
}
