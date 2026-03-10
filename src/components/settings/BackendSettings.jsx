'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/shared/StatusDot';
import { RefreshCw } from 'lucide-react';

export function BackendSettings({ settings, onSave }) {
  const [backend, setBackend] = useState(settings.cortex_backend || 'ollama');
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollama_url || 'http://localhost:11434');
  const [llamacppUrl, setLlamacppUrl] = useState(settings.llamacpp_url || 'http://localhost:8080');
  const [embeddingUrl, setEmbeddingUrl] = useState(settings.cortex_embedding_url || '');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setBackend(settings.cortex_backend || 'ollama');
    setOllamaUrl(settings.ollama_url || 'http://localhost:11434');
    setLlamacppUrl(settings.llamacpp_url || 'http://localhost:8080');
    setEmbeddingUrl(settings.cortex_embedding_url || '');
  }, [settings]);

  const testConnection = useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/ollama');
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

  function handleSave() {
    const updates = { cortex_backend: backend };
    if (backend === 'ollama') {
      updates.ollama_url = ollamaUrl;
    } else {
      updates.llamacpp_url = llamacppUrl;
      updates.cortex_embedding_url = embeddingUrl;
    }
    onSave(updates);
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
        </>
      )}

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
