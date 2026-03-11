'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOllamaStatus() {
  const [connected, setConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ollama/status');
      if (res.ok) {
        const data = await res.json();
        setConnected(true);
        setModels(data.models || []);
      } else {
        setConnected(false);
        setModels([]);
      }
    } catch {
      setConnected(false);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { connected, models, loading, refresh };
}
