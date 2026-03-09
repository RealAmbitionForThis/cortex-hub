'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import cronstrue from 'cronstrue';

export function CronExpressionInput({ value, onChange }) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) { setDescription(''); setError(''); return; }
    try {
      const desc = cronstrue.toString(value);
      setDescription(desc);
      setError('');
    } catch {
      setDescription('');
      setError('Invalid cron expression');
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <Label>Cron Expression</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 9 * * *"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
