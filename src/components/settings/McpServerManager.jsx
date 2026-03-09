'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatusDot } from '@/components/shared/StatusDot';
import { Plus, Trash2 } from 'lucide-react';

export function McpServerManager() {
  const [servers, setServers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', transport: 'sse' });

  useEffect(() => { fetchServers(); }, []);

  async function fetchServers() {
    try {
      const res = await fetch('/api/mcp');
      if (res.ok) { const data = await res.json(); setServers(data.servers || []); }
    } catch { /* API may not exist yet */ }
  }

  async function handleAdd() {
    await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    fetchServers();
    setShowAdd(false);
    setForm({ name: '', url: '', transport: 'sse' });
  }

  async function handleRemove(id) {
    await fetch('/api/mcp', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchServers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">MCP Servers</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Server</Button>
      </div>
      <div className="space-y-3">
        {servers.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={s.status || 'disconnected'} />
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.url}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {servers.length === 0 && <p className="text-sm text-muted-foreground">No MCP servers configured</p>}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add MCP Server</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="http://localhost:3001/sse" /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
