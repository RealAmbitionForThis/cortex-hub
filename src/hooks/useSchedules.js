'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) { const d = await res.json(); setSchedules(d.schedules || []); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  async function addSchedule(data) {
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchSchedules();
  }

  async function toggleSchedule(id, enabled) {
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, enabled }),
    });
    fetchSchedules();
  }

  async function deleteSchedule(id) {
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchSchedules();
  }

  return { schedules, loading, addSchedule, toggleSchedule, deleteSchedule, refresh: fetchSchedules };
}
