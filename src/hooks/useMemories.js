'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMemories(type, module) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (module) params.set('module', module);

      const res = await fetch(`/api/memories?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [type, module]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const addMemory = useCallback(async (memory) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory),
      });
      if (res.ok) fetchMemories();
      return res.ok;
    } catch {
      return false;
    }
  }, [fetchMemories]);

  const deleteMemory = useCallback(async (id) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchMemories();
      return res.ok;
    } catch {
      return false;
    }
  }, [fetchMemories]);

  return { memories, loading, refresh: fetchMemories, addMemory, deleteMemory };
}
