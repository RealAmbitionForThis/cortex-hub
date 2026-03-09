'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Paintbrush, Plus, Play, Image, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ComfyUIPage() {
  const [workflows, setWorkflows] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ name: '', description: '', workflow_json: '', tags: '' });
  const [connected, setConnected] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetch('/api/comfyui/workflows').then(r => r.json()).then(d => setWorkflows(d.workflows || [])).catch(() => {}),
      fetch('/api/comfyui/generations').then(r => r.json()).then(d => setGenerations(d.generations || [])).catch(() => {}),
      fetch('/api/comfyui/status').then(r => r.json()).then(d => setConnected(d.connected || false)).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function selectWorkflow(wf) {
    setSelectedWorkflow(wf);
    const defaults = {};
    (wf.parameters || []).forEach(p => {
      defaults[`${p.node_id}:${p.field}`] = p.default;
    });
    setParamValues(defaults);
  }

  function updateParam(nodeId, field, value) {
    setParamValues(prev => ({ ...prev, [`${nodeId}:${field}`]: value }));
  }

  async function handleGenerate() {
    if (!selectedWorkflow) return;
    setGenerating(true);
    try {
      const params = (selectedWorkflow.parameters || []).map(p => ({
        node_id: p.node_id,
        field: p.field,
        value: paramValues[`${p.node_id}:${p.field}`] ?? p.default,
      }));
      await fetch('/api/comfyui/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: selectedWorkflow.id, params }),
      });
      await fetchAll();
    } catch {
      // handled by UI
    }
    setGenerating(false);
  }

  async function handleImport() {
    try {
      let workflowJson = importForm.workflow_json;
      try { workflowJson = JSON.parse(workflowJson); } catch { /* keep as string */ }
      const tags = importForm.tags ? importForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await fetch('/api/comfyui/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: importForm.name, description: importForm.description, workflow_json: workflowJson, tags }),
      });
      setShowImport(false);
      setImportForm({ name: '', description: '', workflow_json: '', tags: '' });
      await fetchAll();
    } catch {
      // handled by UI
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/comfyui/workflows/${id}`, { method: 'DELETE' });
    if (selectedWorkflow?.id === id) setSelectedWorkflow(null);
    await fetchAll();
  }

  if (loading) return <AppShell title="ComfyUI"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="ComfyUI">
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            <h1 className="text-2xl font-bold">ComfyUI</h1>
            <Badge variant={connected ? 'default' : 'destructive'}>
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <Button onClick={() => setShowImport(true)}>
            <Plus className="h-4 w-4 mr-2" /> Import Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Library */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold">Workflow Library</h2>
            {workflows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No workflows yet. Import one to get started.
                </CardContent>
              </Card>
            ) : (
              workflows.map(wf => (
                <Card
                  key={wf.id}
                  className={`cursor-pointer transition-colors hover:border-primary ${selectedWorkflow?.id === wf.id ? 'border-primary' : ''}`}
                  onClick={() => selectWorkflow(wf)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">{wf.name}</CardTitle>
                    {wf.description && <CardDescription className="text-xs">{wf.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {(wf.tags || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Play className="h-3 w-3" /> {wf.use_count || 0}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(wf.id); }}
                    >
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Generation Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedWorkflow ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Generate: {selectedWorkflow.name}</CardTitle>
                    <CardDescription>Adjust parameters and generate an image</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(selectedWorkflow.parameters || []).map(p => {
                      const key = `${p.node_id}:${p.field}`;
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium">{p.label}</label>
                          {p.type === 'string' && p.field === 'text' ? (
                            <Textarea
                              value={paramValues[key] ?? ''}
                              onChange={(e) => updateParam(p.node_id, p.field, e.target.value)}
                              rows={3}
                            />
                          ) : p.type === 'number' ? (
                            <Input
                              type="number"
                              value={paramValues[key] ?? ''}
                              onChange={(e) => updateParam(p.node_id, p.field, parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            <Input
                              value={paramValues[key] ?? ''}
                              onChange={(e) => updateParam(p.node_id, p.field, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                    <Button onClick={handleGenerate} disabled={generating || !connected} className="w-full">
                      {generating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" /> Generate</>
                      )}
                    </Button>
                    {!connected && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> ComfyUI is not connected. Check settings.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a workflow from the library to start generating.</p>
                </CardContent>
              </Card>
            )}

            {/* Generation History */}
            <h2 className="text-lg font-semibold">Generation History</h2>
            {generations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No generations yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generations.map(gen => (
                  <Card key={gen.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{gen.workflow_name || 'Unknown'}</span>
                        <StatusBadge status={gen.status} />
                      </div>
                      {gen.status === 'queued' || gen.status === 'running' ? (
                        <Progress value={gen.progress * 100} className="mb-2" />
                      ) : null}
                      {gen.output_images && gen.output_images.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {gen.output_images.map((img, i) => (
                            <div key={i} className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              <Image className="h-6 w-6" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {gen.execution_time_seconds ? `${gen.execution_time_seconds.toFixed(1)}s` : 'Pending'}
                        <span>{new Date(gen.created_at).toLocaleString()}</span>
                      </div>
                      {gen.error && (
                        <p className="text-xs text-destructive mt-1">{gen.error}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Import Dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={importForm.name}
                  onChange={(e) => setImportForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My Workflow"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={importForm.description}
                  onChange={(e) => setImportForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Workflow JSON</label>
                <Textarea
                  value={importForm.workflow_json}
                  onChange={(e) => setImportForm(f => ({ ...f, workflow_json: e.target.value }))}
                  placeholder="Paste the workflow JSON from ComfyUI (API format)"
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={importForm.tags}
                  onChange={(e) => setImportForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="landscape, sdxl, portrait"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!importForm.name || !importForm.workflow_json}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Done</Badge>;
    case 'running':
      return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>;
    case 'queued':
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Queued</Badge>;
    case 'error':
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
