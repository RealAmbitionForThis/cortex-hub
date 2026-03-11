'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { DEFAULT_COMFYUI_URL } from '@/lib/constants';

export function ComfyUISettings({ settings, onSave }) {
  const [url, setUrl] = useState(settings?.comfyui_url || DEFAULT_COMFYUI_URL);
  const [connected, setConnected] = useState(null);
  const [testing, setTesting] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [defaultWorkflow, setDefaultWorkflow] = useState(settings?.comfyui_default_workflow || '');

  useEffect(() => {
    fetch('/api/comfyui/workflows')
      .then(r => r.json())
      .then(d => setWorkflows(d.workflows || []))
      .catch(() => {});
  }, []);

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch('/api/comfyui/status');
      const data = await res.json();
      setConnected(data.connected);
      setSystemStats(data.system_stats);
    } catch {
      setConnected(false);
      setSystemStats(null);
    }
    setTesting(false);
  }

  function handleSave() {
    onSave({
      comfyui_url: url,
      comfyui_default_workflow: defaultWorkflow,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ComfyUI Connection</CardTitle>
          <CardDescription>Configure the connection to your ComfyUI instance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ComfyUI URL</label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8188"
              />
              <Button onClick={testConnection} disabled={testing} variant="outline">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </div>
          </div>

          {connected !== null && (
            <div className="flex items-center gap-2">
              {connected ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Not Connected
                </Badge>
              )}
            </div>
          )}

          {systemStats && (
            <div className="text-sm text-muted-foreground space-y-1">
              {systemStats.system?.os && <p>OS: {systemStats.system.os}</p>}
              {systemStats.system?.ram_total && (
                <p>RAM: {(systemStats.system.ram_total / 1073741824).toFixed(1)} GB</p>
              )}
              {systemStats.devices && systemStats.devices.length > 0 && (
                <p>GPU: {systemStats.devices[0].name} ({(systemStats.devices[0].vram_total / 1073741824).toFixed(1)} GB VRAM)</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>Set default workflow for quick generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Workflow</label>
            <Select value={defaultWorkflow} onValueChange={setDefaultWorkflow}>
              <SelectTrigger>
                <SelectValue placeholder="Select a default workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map(wf => (
                  <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
