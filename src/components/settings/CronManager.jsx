'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Clock } from 'lucide-react';
import { cronToHuman } from '@/lib/utils/cron-parser';
import { formatDateTime } from '@/lib/utils/date';

export function CronManager() {
  const [schedules, setSchedules] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', cron_expression: '', action: '', notify_via_ntfy: false });

  useEffect(() => { fetchSchedules(); }, []);

  async function fetchSchedules() {
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) { const data = await res.json(); setSchedules(data.schedules || []); }
    } catch { /* API may not exist yet */ }
  }

  async function handleCreate() {
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'recurring' }),
    });
    fetchSchedules();
    setShowCreate(false);
  }

  async function toggleEnabled(id, enabled) {
    await fetch('/api/schedules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: enabled ? 1 : 0 }),
    });
    fetchSchedules();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Schedule Manager</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Schedule</Button>
      </div>

      <div className="space-y-3">
        {schedules.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> {s.name}</p>
                <p className="text-sm text-muted-foreground">{s.cron_expression ? cronToHuman(s.cron_expression) : 'One-time'}</p>
                {s.last_run && <p className="text-xs text-muted-foreground">Last run: {formatDateTime(s.last_run)}</p>}
              </div>
              <Switch checked={!!s.enabled} onCheckedChange={(v) => toggleEnabled(s.id, v)} />
            </CardContent>
          </Card>
        ))}
        {schedules.length === 0 && <p className="text-sm text-muted-foreground">No schedules configured</p>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Cron Expression</Label>
              <Input value={form.cron_expression} onChange={(e) => setForm({ ...form, cron_expression: e.target.value })} placeholder="0 9 * * *" />
              {form.cron_expression && <p className="text-xs text-muted-foreground mt-1">{cronToHuman(form.cron_expression)}</p>}
            </div>
            <div><Label>Action</Label><Input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.notify_via_ntfy} onCheckedChange={(v) => setForm({ ...form, notify_via_ntfy: v })} /><Label>Send notification</Label></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
