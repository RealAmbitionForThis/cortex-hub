'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database, Clock, Monitor,
} from 'lucide-react';

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function SystemDashboard({ compact = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className={compact ? 'p-2' : 'p-4'}>
        <p className="text-xs text-muted-foreground">Loading system status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={compact ? 'p-2' : 'p-4'}>
        <p className="text-xs text-destructive">System status unavailable</p>
      </div>
    );
  }

  if (!status) return null;

  const { gpu, ollama, cortex, ntfy } = status;

  if (compact) {
    return <CompactDashboard gpu={gpu} ollama={ollama} cortex={cortex} ntfy={ntfy} />;
  }

  return <FullDashboard gpu={gpu} ollama={ollama} cortex={cortex} ntfy={ntfy} />;
}

function CompactDashboard({ gpu, ollama, cortex, ntfy }) {
  return (
    <div className="space-y-3 p-2 text-xs">
      {/* GPU */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <Monitor className="h-3 w-3" />
          GPU
        </div>
        {gpu ? (
          <div className="space-y-1 pl-4">
            <span className="text-foreground">{gpu.name}</span>
            <div className="flex items-center gap-2">
              <Progress value={(gpu.vram_used_mb / gpu.vram_total_mb) * 100} className="h-1.5 flex-1" />
              <span className="text-muted-foreground whitespace-nowrap">
                {gpu.vram_used_mb}/{gpu.vram_total_mb} MB
              </span>
            </div>
            <span className="text-muted-foreground">Util: {gpu.utilization_percent}%</span>
          </div>
        ) : (
          <p className="pl-4 text-muted-foreground">No GPU detected</p>
        )}
      </div>

      {/* Ollama */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          {ollama.connected ? (
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
          )}
          Ollama
        </div>
        {ollama.connected && ollama.loaded_models.length > 0 && (
          <div className="pl-4 space-y-0.5">
            {ollama.loaded_models.map((model, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="truncate text-foreground">{model.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">
                  {model.size_vram_mb} MB
                </Badge>
              </div>
            ))}
          </div>
        )}
        {ollama.connected && ollama.loaded_models.length === 0 && (
          <p className="pl-4 text-muted-foreground">No models loaded</p>
        )}
      </div>

      {/* Cortex */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <Database className="h-3 w-3" />
          Cortex
        </div>
        <div className="pl-4 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">DB:</span>
          <span className="text-foreground">{cortex.db_size_mb} MB</span>
          <span className="text-muted-foreground">Memories:</span>
          <span className="text-foreground">{cortex.memory_count}</span>
          <span className="text-muted-foreground">Tasks:</span>
          <span className="text-foreground">{cortex.task_count_active} active</span>
          {cortex.bills_due_soon > 0 && (
            <>
              <span className="text-muted-foreground">Bills:</span>
              <span className="text-orange-500">{cortex.bills_due_soon} due soon</span>
            </>
          )}
        </div>
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3" />
        Uptime: <span className="text-foreground">{formatUptime(cortex.uptime_seconds)}</span>
      </div>
    </div>
  );
}

function FullDashboard({ gpu, ollama, cortex, ntfy }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* GPU Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            GPU
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gpu ? (
            <div className="space-y-3">
              <p className="font-medium">{gpu.name}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VRAM</span>
                  <span>{gpu.vram_used_mb} / {gpu.vram_total_mb} MB ({Math.round((gpu.vram_used_mb / gpu.vram_total_mb) * 100)}%)</span>
                </div>
                <Progress value={(gpu.vram_used_mb / gpu.vram_total_mb) * 100} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilization</span>
                <span>{gpu.utilization_percent}%</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No GPU detected</p>
          )}
        </CardContent>
      </Card>

      {/* Ollama Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {ollama.connected ? (
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
            )}
            Ollama
            <Badge variant={ollama.connected ? 'default' : 'destructive'} className="ml-auto text-xs">
              {ollama.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ollama.connected ? (
            <div className="space-y-2">
              {ollama.loaded_models.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">Loaded Models</p>
                  <div className="space-y-1.5">
                    {ollama.loaded_models.map((model, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{model.name}</span>
                        <Badge variant="secondary">{model.size_vram_mb} MB VRAM</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t">
                    <span className="text-muted-foreground">Total VRAM</span>
                    <span className="font-medium">{ollama.total_vram_used_mb} MB</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No models currently loaded</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cannot reach Ollama server</p>
          )}
        </CardContent>
      </Card>

      {/* Cortex Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cortex
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Database Size</p>
              <p className="font-medium">{cortex.db_size_mb} MB</p>
            </div>
            <div>
              <p className="text-muted-foreground">Memories</p>
              <p className="font-medium">{cortex.memory_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversations</p>
              <p className="font-medium">{cortex.conversation_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Tasks</p>
              <p className="font-medium">{cortex.task_count_active}</p>
            </div>
            {cortex.bills_due_soon > 0 && (
              <div className="col-span-2">
                <Badge variant="destructive">{cortex.bills_due_soon} bill{cortex.bills_due_soon !== 1 ? 's' : ''} due within 3 days</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{formatUptime(cortex.uptime_seconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notifications</span>
              <Badge variant={ntfy.configured ? 'default' : 'secondary'}>
                {ntfy.configured ? 'Configured' : 'Not configured'}
              </Badge>
            </div>
            {ntfy.last_sent && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Notification</span>
                <span className="text-xs">{new Date(ntfy.last_sent).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
