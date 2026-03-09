'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';

export function ClusterManager() {
  const [clusters, setClusters] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCluster, setNewCluster] = useState({ name: '', description: '', system_prompt_addition: '', icon: '📁', color: '#6366f1' });

  useEffect(() => { fetchClusters(); }, []);

  async function fetchClusters() {
    try {
      const res = await fetch('/api/clusters');
      if (res.ok) { const data = await res.json(); setClusters(data.clusters || []); }
    } catch { /* API may not exist yet */ }
  }

  async function handleCreate() {
    const res = await fetch('/api/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCluster),
    });
    if (res.ok) { fetchClusters(); setShowCreate(false); setNewCluster({ name: '', description: '', system_prompt_addition: '', icon: '📁', color: '#6366f1' }); }
  }

  async function toggleActive(id, active) {
    await fetch(`/api/clusters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: active ? 1 : 0 }),
    });
    fetchClusters();
  }

  async function handleDelete(id) {
    await fetch(`/api/clusters/${id}`, { method: 'DELETE' });
    fetchClusters();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Information Clusters</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Create</Button>
      </div>

      <div className="space-y-3">
        {clusters.map((c) => (
          <Card key={c.id}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{c.icon}</span> {c.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch checked={!!c.active} onCheckedChange={(v) => toggleActive(c.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {c.description && <CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">{c.description}</p></CardContent>}
          </Card>
        ))}
        {clusters.length === 0 && <p className="text-sm text-muted-foreground">No clusters created yet</p>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Cluster</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={newCluster.name} onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={newCluster.description} onChange={(e) => setNewCluster({ ...newCluster, description: e.target.value })} /></div>
            <div><Label>System Prompt Addition</Label><Textarea value={newCluster.system_prompt_addition} onChange={(e) => setNewCluster({ ...newCluster, system_prompt_addition: e.target.value })} /></div>
            <div className="flex gap-4">
              <div><Label>Icon</Label><Input value={newCluster.icon} onChange={(e) => setNewCluster({ ...newCluster, icon: e.target.value })} className="w-20" /></div>
              <div><Label>Color</Label><Input type="color" value={newCluster.color} onChange={(e) => setNewCluster({ ...newCluster, color: e.target.value })} className="w-20 h-10" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
