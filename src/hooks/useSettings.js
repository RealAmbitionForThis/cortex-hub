'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, ...updates }));
      }
      return res.ok;
    } catch (err) {
      setError(err);
      return false;
    }
  }, []);

  const getSetting = useCallback((key, defaultValue) => {
    return settings[key] ?? defaultValue;
  }, [settings]);

  return { settings, loading, error, updateSettings, getSetting, refresh: fetchSettings };
}
