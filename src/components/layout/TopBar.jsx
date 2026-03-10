'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Menu, Sun, Moon, LogOut, Server, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { SystemDashboard } from '@/components/shared/SystemDashboard';
import { cn } from '@/lib/utils';

export function TopBar({ title, onMenuClick }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [models, setModels] = useState([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        fetch('/api/ollama/models').then(r => r.json()).catch(() => ({ models: [] })),
        fetch('/api/settings').then(r => r.json()).catch(() => ({ settings: {} })),
      ]);
      const list = modelsRes.models || [];
      setModels(list);
      const saved = settingsRes.settings?.main_model;
      if (saved) {
        setDefaultModel(saved);
      } else if (list.length > 0) {
        setDefaultModel(list[0].name);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  function openModelModal() {
    setSelectedModel(defaultModel);
    setShowModelModal(true);
  }

  async function saveDefaultModel() {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_model: selectedModel }),
      });
      if (res.ok) {
        setDefaultModel(selectedModel);
        setShowModelModal(false);
        toast.success('Default model updated');
      } else {
        toast.error('Failed to save model');
      }
    } catch {
      toast.error('Failed to save model');
    }
  }

  const modelDisplayName = defaultModel ? defaultModel.split(':')[0] : 'No model';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="flex-1 text-lg font-semibold truncate">
          {title || 'Cortex Hub'}
        </h1>

        <div className="flex items-center gap-1">
          {/* Default model button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs max-w-[160px]"
            onClick={openModelModal}
          >
            <Cpu className="h-3 w-3 mr-1.5 shrink-0" />
            <span className="truncate">{modelDisplayName}</span>
          </Button>

          {/* System Status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Server className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <SystemDashboard compact={true} />
            </PopoverContent>
          </Popover>

          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Model Settings Modal */}
      <Dialog open={showModelModal} onOpenChange={setShowModelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Default Model</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select the default model for all conversations.</p>
          <div className="space-y-1 max-h-[50vh] overflow-auto">
            {models.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No models available. Check Ollama connection.</p>
            ) : (
              models.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setSelectedModel(m.name)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent flex items-center justify-between',
                    selectedModel === m.name && 'bg-accent ring-1 ring-primary'
                  )}
                >
                  <span className="font-medium truncate">{m.name}</span>
                  {m.size && (
                    <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                      {typeof m.size === 'number' ? `${(m.size / 1e9).toFixed(1)}GB` : m.size}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModelModal(false)}>Cancel</Button>
            <Button onClick={saveDefaultModel} disabled={!selectedModel}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
