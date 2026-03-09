'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Download, RefreshCw, HardDrive } from 'lucide-react';

const QUICK_PULL = ['gpt-oss:20b', 'qwen2.5-vl:7b', 'nomic-embed-text', 'qwen3-coder-next'];

function formatSize(bytes) {
  if (!bytes) return 'N/A';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function OllamaModelManager() {
  const [models, setModels] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pullName, setPullName] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);
  const [pullStatus, setPullStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const intervalRef = useRef(null);

  const fetchModels = useCallback(async () => {
    try {
      const [modelsRes, statusRes] = await Promise.all([
        fetch('/api/ollama/models'),
        fetch('/api/ollama/status'),
      ]);
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.models || []);
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setLoadedModels(data.models || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    intervalRef.current = setInterval(fetchModels, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchModels]);

  const isLoaded = useCallback(
    (modelName) => loadedModels.some((m) => m.name === modelName),
    [loadedModels]
  );

  const getVramUsage = useCallback(
    (modelName) => {
      const m = loadedModels.find((lm) => lm.name === modelName);
      return m ? m.size_vram : null;
    },
    [loadedModels]
  );

  async function handlePull(name) {
    const modelName = name || pullName.trim();
    if (!modelName) return;

    setPulling(true);
    setPullProgress(0);
    setPullStatus('Starting pull...');

    try {
      const res = await fetch('/api/ollama/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const stripped = line.replace(/^data: /, '');
          if (stripped === '[DONE]') continue;
          try {
            const event = JSON.parse(stripped);
            if (event.error) {
              setPullStatus(`Error: ${event.error}`);
              continue;
            }
            setPullStatus(event.status || '');
            if (event.total > 0) {
              setPullProgress(Math.round((event.completed / event.total) * 100));
            }
          } catch {
            // skip
          }
        }
      }

      setPullStatus('Complete');
      setPullProgress(100);
      setPullName('');
      fetchModels();
    } catch (err) {
      setPullStatus(`Error: ${err.message}`);
    } finally {
      setPulling(false);
      setTimeout(() => {
        setPullProgress(null);
        setPullStatus('');
      }, 3000);
    }
  }

  async function handleDelete(name) {
    setDeleting(true);
    try {
      const res = await fetch('/api/ollama/models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchModels();
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Installed Models</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchModels} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {models.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">No models installed.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Model</th>
                    <th className="pb-2 pr-4 font-medium">Size</th>
                    <th className="pb-2 pr-4 font-medium">Quantization</th>
                    <th className="pb-2 pr-4 font-medium">Modified</th>
                    <th className="pb-2 pr-4 font-medium">VRAM</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.name} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {isLoaded(model.name) && (
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="Loaded in VRAM" />
                          )}
                          <span className="font-mono text-sm">{model.name}</span>
                          {model.parameter_size && (
                            <Badge variant="secondary" className="text-xs">
                              {model.parameter_size}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatSize(model.size)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {model.quantization_level || 'N/A'}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatDate(model.modified_at)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {getVramUsage(model.name) !== null ? (
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatSize(getVramUsage(model.name))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2">
                        {deleteConfirm === model.name ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(model.name)}
                              disabled={deleting}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                              disabled={deleting}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(model.name)}
                            disabled={pulling}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Pull Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="model:tag (e.g. llama3.1:8b)"
              value={pullName}
              onChange={(e) => setPullName(e.target.value)}
              disabled={pulling}
              onKeyDown={(e) => e.key === 'Enter' && handlePull()}
            />
            <Button onClick={() => handlePull()} disabled={pulling || !pullName.trim()}>
              <Download className="h-4 w-4 mr-2" />
              Pull
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_PULL.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => !pulling && handlePull(name)}
              >
                {name}
              </Badge>
            ))}
          </div>

          {pullProgress !== null && (
            <div className="space-y-2">
              <Progress value={pullProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{pullStatus} {pullProgress}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
