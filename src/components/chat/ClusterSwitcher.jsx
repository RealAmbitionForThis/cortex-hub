'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Layers } from 'lucide-react';

export function ClusterSwitcher() {
  const [clusters, setClusters] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/clusters')
      .then((r) => r.json())
      .then((d) => setClusters(d.clusters || []))
      .catch(() => toast.error('Failed to load clusters'));
  }, [open]);

  const activeCount = clusters.filter((c) => c.active).length;

  async function toggleCluster(id, active) {
    const prev = clusters;
    // Optimistic update
    setClusters((c) =>
      c.map((cl) => cl.id === id ? { ...cl, active: active ? 1 : 0 } : cl)
    );
    try {
      const res = await fetch(`/api/clusters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: active ? 1 : 0 }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback on failure
      setClusters(prev);
      toast.error('Failed to toggle cluster');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Layers className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="text-sm font-medium px-2 py-1">Clusters</p>
        {clusters.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1">No clusters created</p>
        ) : (
          clusters.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm flex items-center gap-2">
                <span>{c.icon}</span> {c.name}
              </span>
              <Switch
                checked={!!c.active}
                onCheckedChange={(v) => toggleCluster(c.id, v)}
              />
            </div>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
