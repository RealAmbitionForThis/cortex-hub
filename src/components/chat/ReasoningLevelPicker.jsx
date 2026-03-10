'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVELS = [
  { value: 'low', label: 'Quick', color: 'text-green-500', description: 'Fast responses' },
  { value: 'medium', label: 'Balanced', color: 'text-yellow-500', description: 'Default thinking' },
  { value: 'high', label: 'Deep', color: 'text-red-500', description: 'Maximum reasoning' },
];

// Cache model capability results so we don't hit the API repeatedly
const capabilityCache = new Map();

async function checkModelThinking(modelName) {
  if (!modelName) return true;
  if (capabilityCache.has(modelName)) return capabilityCache.get(modelName);

  try {
    const res = await fetch(`/api/models?name=${encodeURIComponent(modelName)}`);
    if (res.ok) {
      const data = await res.json();
      const supports = data.supportsThinking ?? true;
      capabilityCache.set(modelName, supports);
      return supports;
    }
  } catch {
    // If API fails, default to showing the picker
  }
  capabilityCache.set(modelName, true);
  return true;
}

export function ReasoningLevelPicker({ value, onChange, modelName }) {
  const [supported, setSupported] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!modelName) {
      setSupported(true);
      setChecked(true);
      return;
    }
    checkModelThinking(modelName).then(result => {
      setSupported(result);
      setChecked(true);
    });
  }, [modelName]);

  // Don't render anything until we've checked (prevents flash)
  if (!checked) return null;
  if (!supported) return null;

  const current = LEVELS.find((l) => l.value === value) || LEVELS[1];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Brain className={cn('h-3.5 w-3.5', current.color)} />
          <span className="text-xs hidden sm:inline">{current.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" side="top">
        <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Thinking Level</p>
        {LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-accent flex items-center gap-2',
              value === level.value && 'bg-accent'
            )}
          >
            <Brain className={cn('h-4 w-4', level.color)} />
            <div>
              <span className="font-medium">{level.label}</span>
              <p className="text-xs text-muted-foreground">{level.description}</p>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
