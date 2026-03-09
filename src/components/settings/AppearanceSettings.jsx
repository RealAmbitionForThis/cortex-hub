'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Appearance</h3>
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              className={cn('flex-1')}
              onClick={() => setTheme(value)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
