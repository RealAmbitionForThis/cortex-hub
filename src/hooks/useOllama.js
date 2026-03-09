'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOllama() {
  const [connected, setConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ollama');
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
