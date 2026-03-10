'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Wrench, Globe, Calculator, Database, FileText, Bell, Search, Car, Heart, Users, DollarSign, Paintbrush, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOL_CATEGORIES = [
  { id: 'web_search', label: 'Web Search', icon: Globe, description: 'Search the internet' },
  { id: 'tools', label: 'All Tools', icon: Wrench, description: 'Enable AI tools' },
];

export function ToolToggle({ enabledTools, onToggle }) {
  const webSearchEnabled = enabledTools.web_search !== false;
  const toolsEnabled = enabledTools.tools !== false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Wrench className={cn('h-3.5 w-3.5', toolsEnabled ? 'text-primary' : 'text-muted-foreground')} />
          <span className="text-xs hidden sm:inline">Tools</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="top">
        <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Features</p>
        {TOOL_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const enabled = cat.id === 'web_search' ? webSearchEnabled : toolsEnabled;
          return (
            <div key={cat.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm">{cat.label}</span>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => onToggle(cat.id, v)}
              />
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
