'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function SystemPromptEditor({ conversationId, value, onChange }) {
  const [draft, setDraft] = useState(value || '');
  const [open, setOpen] = useState(false);

  async function handleSave() {
    if (!conversationId) {
      toast.error('Start a conversation first');
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt_override: draft || null }),
      });
      if (res.ok) {
        onChange?.(draft);
        toast.success('System prompt updated');
        setOpen(false);
      }
    } catch {
      toast.error('Failed to save');
    }
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setDraft(value || ''); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <ScrollText className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Prompt</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2" align="start" side="top">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat System Prompt</p>
        <p className="text-[10px] text-muted-foreground">Override the system prompt for this chat only. Leave empty to use project/default prompt.</p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Custom instructions for this chat..."
          rows={4}
          className="text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setDraft(''); }}>Clear</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
