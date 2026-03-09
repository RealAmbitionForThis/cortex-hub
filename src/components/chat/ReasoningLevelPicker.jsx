'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVELS = [
  { value: 'low', label: 'Quick', color: 'text-green-500' },
  { value: 'medium', label: 'Balanced', color: 'text-yellow-500' },
  { value: 'high', label: 'Deep', color: 'text-red-500' },
];

export function ReasoningLevelPicker({ value, onChange }) {
  const current = LEVELS.find((l) => l.value === value) || LEVELS[1];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Brain className={cn('h-4 w-4', current.color)} />
          <span className="text-xs hidden sm:inline">{current.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
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
            {level.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
