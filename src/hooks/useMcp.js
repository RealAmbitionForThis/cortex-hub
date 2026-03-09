'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMcp() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mcp');
      if (res.ok) { const d = await res.json(); setServers(d.servers || []); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  async function addServer(data) {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchServers();
      return await res.json();
    } catch {
      return { error: 'Failed to add server' };
    }
  }

  async function updateServer(id, updates) {
    try {
      await fetch('/api/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      fetchServers();
    } catch {}
  }

  async function deleteServer(id) {
    try {
      await fetch(`/api/mcp?id=${id}`, { method: 'DELETE' });
      fetchServers();
    } catch {}
  }

  return { servers, loading, addServer, updateServer, deleteServer, refresh: fetchServers };
}
