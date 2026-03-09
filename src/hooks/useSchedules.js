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
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchSchedules();
    } catch {}
  }

  async function toggleSchedule(id, enabled) {
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id, enabled }),
      });
      fetchSchedules();
    } catch {}
  }

  async function deleteSchedule(id) {
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      fetchSchedules();
    } catch {}
  }

  return { schedules, loading, addSchedule, toggleSchedule, deleteSchedule, refresh: fetchSchedules };
}
