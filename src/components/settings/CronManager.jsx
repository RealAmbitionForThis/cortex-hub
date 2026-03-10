'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, Pencil } from 'lucide-react';
import { cronToHuman, buildCronExpression } from '@/lib/utils/cron-parser';
import { formatDateTime } from '@/lib/utils/date';
import { toast } from 'sonner';

const AVAILABLE_TOOLS = [
  { id: 'notify', label: 'Notifications' },
  { id: 'money', label: 'Money / Finance' },
  { id: 'health', label: 'Health' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'search', label: 'Search' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'vehicle', label: 'Vehicle' },
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const DEFAULT_FORM = {
  name: '',
  frequency: 'daily',
  minute: '0',
  hour: '9',
  dayOfWeek: '1',
  dayOfMonth: '1',
  interval: '5',
  prompt: '',
  project_id: '',
  tools: [],
  notify_via_ntfy: false,
};

function parseParamsJson(paramsStr) {
  if (!paramsStr) return { project_id: null, tools: [] };
  try {
    return JSON.parse(paramsStr);
  } catch {
    return { project_id: null, tools: [] };
  }
}

function frequencyFromCron(cron) {
  if (!cron) return { frequency: 'daily', minute: '0', hour: '9', dayOfWeek: '1', dayOfMonth: '1', interval: '5' };
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return { frequency: 'daily', minute: '0', hour: '9', dayOfWeek: '1', dayOfMonth: '1', interval: '5' };

  const [min, hr, dom, , dow] = parts;

  if (min.startsWith('*/')) {
    return { frequency: 'minutes', interval: min.replace('*/', ''), minute: '0', hour: '9', dayOfWeek: '1', dayOfMonth: '1' };
  }
  if (hr === '*') {
    return { frequency: 'hourly', minute: min, hour: '9', dayOfWeek: '1', dayOfMonth: '1', interval: '5' };
  }
  if (dow !== '*') {
    return { frequency: 'weekly', minute: min, hour: hr, dayOfWeek: dow, dayOfMonth: '1', interval: '5' };
  }
  if (dom !== '*') {
    return { frequency: 'monthly', minute: min, hour: hr, dayOfWeek: '1', dayOfMonth: dom, interval: '5' };
  }
  return { frequency: 'daily', minute: min, hour: hr, dayOfWeek: '1', dayOfMonth: '1', interval: '5' };
}

export function CronManager() {
  const [schedules, setSchedules] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  useEffect(() => {
    fetchSchedules();
    fetchProjects();
  }, []);

  async function fetchSchedules() {
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      }
    } catch { /* API may not exist yet */ }
  }

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch { /* ignore */ }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setDialogOpen(true);
  }

  function openEdit(schedule) {
    const params = parseParamsJson(schedule.params);
    const cronFields = frequencyFromCron(schedule.cron_expression);

    setEditingId(schedule.id);
    setForm({
      name: schedule.name || '',
      ...cronFields,
      prompt: schedule.action || '',
      project_id: params.project_id || '',
      tools: params.tools || [],
      notify_via_ntfy: !!schedule.notify_via_ntfy,
    });
    setDialogOpen(true);
  }

  function getCronFromForm() {
    return buildCronExpression(form.frequency, {
      minute: parseInt(form.minute, 10) || 0,
      hour: parseInt(form.hour, 10) || 0,
      dayOfWeek: parseInt(form.dayOfWeek, 10) || 0,
      dayOfMonth: parseInt(form.dayOfMonth, 10) || 1,
      interval: parseInt(form.interval, 10) || 5,
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }
    if (!form.prompt.trim()) {
      toast.error('Please enter a prompt / action');
      return;
    }

    const cronExpression = getCronFromForm();
    const payload = {
      name: form.name,
      cron_expression: cronExpression,
      prompt: form.prompt,
      project_id: form.project_id || null,
      tools: form.tools,
      notify_via_ntfy: form.notify_via_ntfy,
    };

    try {
      if (editingId) {
        await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        toast.success('Schedule updated');
      } else {
        await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Schedule created');
      }
      fetchSchedules();
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save schedule');
    }
  }

  async function toggleEnabled(id, enabled) {
    await fetch('/api/schedules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: enabled ? 1 : 0 }),
    });
    fetchSchedules();
  }

  async function handleDelete(id) {
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      toast.success('Schedule deleted');
      setDeleteConfirm(null);
      fetchSchedules();
    } catch {
      toast.error('Failed to delete schedule');
    }
  }

  function toggleTool(toolId) {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  }

  function getProjectName(projectId) {
    const p = projects.find((proj) => proj.id === projectId);
    return p ? p.name : null;
  }

  const cronPreview = getCronFromForm();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Schedule Manager</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Schedule
        </Button>
      </div>

      <div className="space-y-3">
        {schedules.map((s) => {
          const params = parseParamsJson(s.params);
          const projectName = params.project_id ? getProjectName(params.project_id) : null;

          return (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" /> {s.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.cron_expression ? cronToHuman(s.cron_expression) : 'One-time'}
                    </p>
                    {s.action && (
                      <p className="text-sm text-muted-foreground truncate" title={s.action}>
                        {s.action}
                      </p>
                    )}
                    {projectName && (
                      <p className="text-xs text-muted-foreground">Project: {projectName}</p>
                    )}
                    {s.last_run && (
                      <p className="text-xs text-muted-foreground">
                        Last run: {formatDateTime(s.last_run)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Switch checked={!!s.enabled} onCheckedChange={(v) => toggleEnabled(s.id, v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {schedules.length === 0 && (
          <p className="text-sm text-muted-foreground">No schedules configured</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this schedule? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning bill check"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Every X minutes</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval for "minutes" */}
            {form.frequency === 'minutes' && (
              <div className="space-y-1.5">
                <Label>Every how many minutes?</Label>
                <Input
                  type="number"
                  min="1"
                  max="59"
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value })}
                />
              </div>
            )}

            {/* Minute for hourly */}
            {form.frequency === 'hourly' && (
              <div className="space-y-1.5">
                <Label>At minute</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={form.minute}
                  onChange={(e) => setForm({ ...form, minute: e.target.value })}
                />
              </div>
            )}

            {/* Time picker for daily/weekly/monthly */}
            {['daily', 'weekly', 'monthly'].includes(form.frequency) && (
              <div className="space-y-1.5">
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={form.hour}
                      onChange={(e) => setForm({ ...form, hour: e.target.value })}
                      placeholder="Hour (0-23)"
                    />
                  </div>
                  <span className="text-muted-foreground font-medium">:</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={form.minute}
                      onChange={(e) => setForm({ ...form, minute: e.target.value })}
                      placeholder="Minute (0-59)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Day of week for weekly */}
            {form.frequency === 'weekly' && (
              <div className="space-y-1.5">
                <Label>Day of week</Label>
                <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day of month for monthly */}
            {form.frequency === 'monthly' && (
              <div className="space-y-1.5">
                <Label>Day of month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dayOfMonth}
                  onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                />
              </div>
            )}

            {/* Cron preview */}
            <p className="text-xs text-muted-foreground">
              Schedule: {cronToHuman(cronPreview)}
            </p>

            {/* Prompt / Action */}
            <div className="space-y-1.5">
              <Label>Prompt / Action</Label>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder="e.g. Check my upcoming bills and send a notification about any due in the next 3 days"
                rows={3}
              />
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <Label>Project (optional)</Label>
              <Select value={form.project_id || '_none'} onValueChange={(v) => setForm({ ...form, project_id: v === '_none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tools */}
            <div className="space-y-1.5">
              <Label>Tools to use</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <label key={tool.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.tools.includes(tool.id)}
                      onCheckedChange={() => toggleTool(tool.id)}
                    />
                    <span className="text-sm">{tool.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.notify_via_ntfy}
                onCheckedChange={(v) => setForm({ ...form, notify_via_ntfy: v })}
              />
              <Label>Send push notification when done</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
