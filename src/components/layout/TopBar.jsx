'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';

export function TopBar({ title, onMenuClick }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/ollama/models');
      if (res.ok) {
        const data = await res.json();
        const list = data.models || [];
        setModels(list);
        if (!selectedModel && list.length > 0) {
          setSelectedModel(list[0].name);
        }
      }
    } catch {
      // silently fail
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="flex-1 text-lg font-semibold truncate">
        {title || 'Cortex Hub'}
      </h1>

      <div className="flex items-center gap-1">
        {models.length > 0 && (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <NotificationBell />
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
