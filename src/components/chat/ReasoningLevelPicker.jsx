'use client';

import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THINKING_PROFILES, detectModelFamily } from '@/lib/llm/thinking';

export function ReasoningLevelPicker({ value, onChange, modelName }) {
  const profile = useMemo(() => {
    const family = detectModelFamily(modelName);
    return THINKING_PROFILES[family];
  }, [modelName]);

  const current = profile.levels.find((l) => l.value === value)
    || profile.levels.find((l) => l.value === profile.defaultLevel)
    || profile.levels[0];

  // If the current value doesn't exist in this profile's levels, reset to default
  const validValues = useMemo(() => profile.levels.map((l) => l.value), [profile]);
  useEffect(() => {
    if (!validValues.includes(value)) {
      onChange(profile.defaultLevel);
    }
  }, [value, validValues, profile.defaultLevel, onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Brain className={cn('h-3.5 w-3.5', current.color)} />
          <span className="text-xs hidden sm:inline">{current.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start" side="top">
        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
          Thinking — {profile.label}
        </p>
        {profile.levels.map((level) => (
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
