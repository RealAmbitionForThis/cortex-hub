'use client';

import { useState, useEffect, useCallback } from 'react';

export function useExports() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exports');
      if (res.ok) { const d = await res.json(); setExports(d.exports || []); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchExports(); }, [fetchExports]);

  async function exportData(mod, format = 'xlsx') {
    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: mod, format }),
      });
      const data = await res.json();
      fetchExports();
      return data;
    } catch {
      return { error: 'Export failed' };
    }
  }

  return { exports, loading, exportData, refresh: fetchExports };
}
