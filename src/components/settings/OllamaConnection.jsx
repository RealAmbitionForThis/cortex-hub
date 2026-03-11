'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusDot } from '@/components/shared/StatusDot';
import { useOllamaStatus } from '@/hooks/useOllamaStatus';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export function OllamaConnection({ settings, onSave }) {
  const { connected, models, refresh, loading } = useOllamaStatus();
  const [url, setUrl] = useState(settings.ollama_url || 'http://localhost:11434');

  useEffect(() => {
    setUrl(settings.ollama_url || 'http://localhost:11434');
  }, [settings]);

  function handleSave() {
    onSave({ ollama_url: url });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Ollama Connection</h3>
      <div className="flex items-center gap-3">
        <StatusDot status={connected ? 'connected' : 'disconnected'} />
        <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Test
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Ollama URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      {connected && models.length > 0 && (
        <div>
          <Label>Available Models ({models.length})</Label>
          <div className="mt-2 space-y-1">
            {models.map((m) => (
              <p key={m.name} className="text-sm text-muted-foreground">{m.name}</p>
            ))}
          </div>
        </div>
      )}
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
