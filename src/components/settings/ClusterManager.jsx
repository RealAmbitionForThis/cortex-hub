'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { Plus, Trash2, FileText, X } from 'lucide-react';

export function ClusterManager() {
  const [clusters, setClusters] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCluster, setNewCluster] = useState({ name: '', description: '', system_prompt_addition: '', icon: '\u{1F4C1}', color: '#6366f1' });
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => { fetchClusters(); }, []);

  async function fetchClusters() {
    try {
      const res = await fetch('/api/clusters');
      if (res.ok) { const data = await res.json(); setClusters(data.clusters || []); }
    } catch {
      toast.error('Failed to load clusters');
    }
  }

  async function handleCreate() {
    try {
      // Create the cluster first
      const res = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCluster),
      });

      if (!res.ok) {
        toast.error('Failed to create cluster');
        return;
      }

      const data = await res.json();
      const clusterId = data.id;

      // Upload files if any
      if (pendingFiles.length > 0) {
        const uploadFormData = new FormData();
        for (const file of pendingFiles) {
          uploadFormData.append('files', file);
        }
        uploadFormData.append('category', `clusters/${clusterId}`);

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (!uploadRes.ok) {
          toast.error('Cluster created but file upload failed');
        }

        // Also index files as documents associated with the cluster
        for (const file of pendingFiles) {
          const docFormData = new FormData();
          docFormData.append('file', file);
          docFormData.append('title', file.name);
          await fetch('/api/documents', { method: 'POST', body: docFormData }).catch(() => {});
        }
      }

      toast.success('Cluster created');
      fetchClusters();
      setShowCreate(false);
      setNewCluster({ name: '', description: '', system_prompt_addition: '', icon: '\u{1F4C1}', color: '#6366f1' });
      setPendingFiles([]);
    } catch {
      toast.error('Failed to create cluster');
    }
  }

  async function toggleActive(id, active) {
    try {
      await fetch(`/api/clusters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: active ? 1 : 0 }),
      });
      toast.success(active ? 'Cluster activated' : 'Cluster deactivated');
      fetchClusters();
    } catch {
      toast.error('Failed to update cluster');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/clusters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Cluster deleted');
        fetchClusters();
      } else {
        toast.error('Failed to delete cluster');
      }
    } catch {
      toast.error('Failed to delete cluster');
    }
  }

  function handleFilesSelected(files) {
    setPendingFiles(prev => [...prev, ...files]);
  }

  function removeFile(index) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
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

      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) setPendingFiles([]); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Cluster</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={newCluster.name} onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={newCluster.description} onChange={(e) => setNewCluster({ ...newCluster, description: e.target.value })} /></div>
            <div><Label>System Prompt Addition</Label><Textarea value={newCluster.system_prompt_addition} onChange={(e) => setNewCluster({ ...newCluster, system_prompt_addition: e.target.value })} /></div>
            <div className="flex gap-4">
              <div><Label>Icon</Label><Input value={newCluster.icon} onChange={(e) => setNewCluster({ ...newCluster, icon: e.target.value })} className="w-20" /></div>
              <div><Label>Color</Label><Input type="color" value={newCluster.color} onChange={(e) => setNewCluster({ ...newCluster, color: e.target.value })} className="w-20 h-10" /></div>
            </div>

            {/* File upload section */}
            <div>
              <Label>Files (optional)</Label>
              <FileUpload onUpload={handleFilesSelected} accept="*" className="mt-1" />
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={!newCluster.name}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
