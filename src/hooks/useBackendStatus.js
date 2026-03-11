'use client';

import { useState, useEffect, useCallback } from 'react';

export function useBackendStatus() {
  const [connected, setConnected] = useState(false);
  const [models, setModels] = useState([]);
  const [serverProps, setServerProps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backend/status');
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        setModels(data.models || []);
        setServerProps(data.serverProps || null);
      } else {
        setConnected(false);
      }
    } catch (err) {
      setConnected(false);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { connected, models, serverProps, loading, error, refresh };
}
