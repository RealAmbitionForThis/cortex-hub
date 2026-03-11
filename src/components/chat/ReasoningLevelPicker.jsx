'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { value: 'auto', label: 'Auto', description: 'Detect from model name' },
  { value: 'gpt-oss', label: 'GPT-OSS', description: 'Low / Medium / High levels' },
  { value: 'deepseek', label: 'DeepSeek', description: 'DeepSeek R1 / R1-distill' },
  { value: 'qwen', label: 'Qwen', description: 'Qwen3 / QwQ / Bailing' },
  { value: 'kimi', label: 'Kimi', description: 'Kimi K2 thinking' },
  { value: 'generic', label: 'Generic', description: 'Standard <think> tag models' },
];

const LEVELS = [
  { value: 'low', label: 'No Thinking', color: 'text-green-500', description: 'Thinking disabled' },
  { value: 'medium', label: 'Think', color: 'text-yellow-500', description: 'Standard thinking' },
  { value: 'high', label: 'Think+', color: 'text-red-500', description: 'Extended thinking' },
];

export function ReasoningLevelPicker({ value, onChange, thinkingTemplate, onTemplateChange }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const current = LEVELS.find((l) => l.value === value) || LEVELS[1];
  const currentTemplate = TEMPLATES.find((t) => t.value === (thinkingTemplate || 'auto')) || TEMPLATES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Brain className={cn('h-3.5 w-3.5', current.color)} />
          <span className="text-xs hidden sm:inline">{current.label}</span>
          {thinkingTemplate && thinkingTemplate !== 'auto' && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">({currentTemplate.label})</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start" side="top">
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

        <div className="border-t mt-1 pt-1">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full text-left px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground flex items-center justify-between"
          >
            Template: {currentTemplate.label}
            <span className="text-[10px]">{showTemplates ? '▲' : '▼'}</span>
          </button>
          {showTemplates && TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.value}
              onClick={() => { onTemplateChange?.(tmpl.value); setShowTemplates(false); }}
              className={cn(
                'w-full text-left px-3 py-1.5 rounded-sm text-sm hover:bg-accent',
                (thinkingTemplate || 'auto') === tmpl.value && 'bg-accent'
              )}
            >
              <span className="font-medium">{tmpl.label}</span>
              <p className="text-[10px] text-muted-foreground">{tmpl.description}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
