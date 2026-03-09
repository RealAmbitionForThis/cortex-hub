'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';

export function NotificationSettings({ settings, onSave }) {
  const [ntfyUrl, setNtfyUrl] = useState(settings.ntfy_url || 'https://ntfy.sh');
  const [ntfyTopic, setNtfyTopic] = useState(settings.ntfy_topic || '');
  const [notifyBills, setNotifyBills] = useState(settings.notify_bills !== false);
  const [notifyTasks, setNotifyTasks] = useState(settings.notify_tasks !== false);
  const [notifyMaintenance, setNotifyMaintenance] = useState(settings.notify_maintenance !== false);
  const [notifyFollowups, setNotifyFollowups] = useState(settings.notify_followups !== false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setNtfyUrl(settings.ntfy_url || 'https://ntfy.sh');
    setNtfyTopic(settings.ntfy_topic || '');
  }, [settings]);

  async function handleTest() {
    setTesting(true);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', message: 'Cortex is connected!', test: true }),
      });
    } catch { /* ignore */ }
    setTesting(false);
  }

  function handleSave() {
    onSave({ ntfy_url: ntfyUrl, ntfy_topic: ntfyTopic, notify_bills: notifyBills, notify_tasks: notifyTasks, notify_maintenance: notifyMaintenance, notify_followups: notifyFollowups });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Notifications</h3>
      <div className="space-y-2"><Label>ntfy URL</Label><Input value={ntfyUrl} onChange={(e) => setNtfyUrl(e.target.value)} /></div>
      <div className="space-y-2"><Label>ntfy Topic</Label><Input value={ntfyTopic} onChange={(e) => setNtfyTopic(e.target.value)} placeholder="your-topic-name" /></div>
      <Button variant="outline" onClick={handleTest} disabled={testing}><Bell className="h-4 w-4 mr-2" /> {testing ? 'Sending...' : 'Test Notification'}</Button>
      <div className="space-y-3">
        <div className="flex items-center gap-3"><Switch checked={notifyBills} onCheckedChange={setNotifyBills} /><Label>Bill reminders</Label></div>
        <div className="flex items-center gap-3"><Switch checked={notifyTasks} onCheckedChange={setNotifyTasks} /><Label>Overdue tasks</Label></div>
        <div className="flex items-center gap-3"><Switch checked={notifyMaintenance} onCheckedChange={setNotifyMaintenance} /><Label>Maintenance reminders</Label></div>
        <div className="flex items-center gap-3"><Switch checked={notifyFollowups} onCheckedChange={setNotifyFollowups} /><Label>Follow-up reminders</Label></div>
      </div>
      <Button onClick={handleSave}>Save Notification Settings</Button>
    </div>
  );
}
