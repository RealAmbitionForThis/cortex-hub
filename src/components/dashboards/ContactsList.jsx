'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User } from 'lucide-react';

export function ContactsList({ contacts, selected, onSelect, onDelete }) {
  return (
    <div className="space-y-1">
      {contacts.map((c) => (
        <div
          key={c.id}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selected === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
          onClick={() => onSelect(c.id)}
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[c.company, c.email].filter(Boolean).join(' • ')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
