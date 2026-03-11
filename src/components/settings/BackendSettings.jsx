'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/shared/StatusDot';
import { RefreshCw, Plus, X } from 'lucide-react';

export function BackendSettings({ settings, onSave }) {
  const [backend, setBackend] = useState(settings.cortex_backend || 'ollama');
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollama_url || 'http://localhost:11434');
  const [llamacppUrl, setLlamacppUrl] = useState(settings.llamacpp_url || 'http://localhost:8080');
  const [embeddingUrl, setEmbeddingUrl] = useState(settings.cortex_embedding_url || '');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [llamaModels, setLlamaModels] = useState(() => {
    try { const raw = settings.llamacpp_models; return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    setBackend(settings.cortex_backend || 'ollama');
    setOllamaUrl(settings.ollama_url || 'http://localhost:11434');
    setLlamacppUrl(settings.llamacpp_url || 'http://localhost:8080');
    setEmbeddingUrl(settings.cortex_embedding_url || '');
    try { const raw = settings.llamacpp_models; setLlamaModels(raw ? JSON.parse(raw) : []); } catch { setLlamaModels([]); }
  }, [settings]);

  const testConnection = useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/backend/status');
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  function addLlamaModel() {
    const name = newModelName.trim();
    if (!name || llamaModels.includes(name)) return;
    setLlamaModels(prev => [...prev, name]);
    setNewModelName('');
  }

  function removeLlamaModel(name) {
    setLlamaModels(prev => prev.filter(m => m !== name));
  }

  function handleSave() {
    const updates = { cortex_backend: backend };
    if (backend === 'ollama') {
      updates.ollama_url = ollamaUrl;
    } else {
      updates.llamacpp_url = llamacppUrl;
      updates.cortex_embedding_url = embeddingUrl;
      updates.llamacpp_models = JSON.stringify(llamaModels);
    }
    onSave(updates);
    toast.success('Backend settings saved');
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">LLM Backend</h3>

      <div className="flex items-center gap-3">
        <StatusDot status={connected ? 'connected' : 'disconnected'} />
        <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} /> Test
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Backend</Label>
        <Select value={backend} onValueChange={setBackend}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama</SelectItem>
            <SelectItem value="llamacpp">llama.cpp (llama-server)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {backend === 'ollama'
            ? 'Uses Ollama native API for chat, embeddings, and model management.'
            : 'Uses llama-server OpenAI-compatible API. Model management is handled externally.'}
        </p>
      </div>

      {backend === 'ollama' && (
        <div className="space-y-2">
          <Label>Ollama URL</Label>
          <Input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" />
        </div>
      )}

      {backend === 'llamacpp' && (
        <>
          <div className="space-y-2">
            <Label>llama-server URL</Label>
            <Input value={llamacppUrl} onChange={(e) => setLlamacppUrl(e.target.value)} placeholder="http://localhost:8080" />
          </div>
          <div className="space-y-2">
            <Label>Embedding URL (optional)</Label>
            <Input value={embeddingUrl} onChange={(e) => setEmbeddingUrl(e.target.value)} placeholder="http://localhost:8080" />
            <p className="text-xs text-muted-foreground">
              Fallback endpoint for embeddings if llama-server was not started with --embedding. Leave empty to try the main llama-server URL first.
            </p>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Model Names</Label>
            <p className="text-xs text-muted-foreground">
              llama-server does not always list models via API. Add model names here so they appear in the model selector.
            </p>
            <div className="flex gap-2">
              <Input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLlamaModel(); } }}
                placeholder="e.g. gemma-3-12b-it"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addLlamaModel} disabled={!newModelName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {llamaModels.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {llamaModels.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs font-mono">
                    {m}
                    <button onClick={() => removeLlamaModel(m)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
