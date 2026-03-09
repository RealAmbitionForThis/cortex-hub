'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Copy, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MessageToolbar({ message, onEdit, onDelete, onCopy, onRegenerate }) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {message.role === 'user' && (
        <ToolbarButton icon={Pencil} label="Edit" onClick={onEdit} />
      )}
      <ToolbarButton icon={Copy} label="Copy" onClick={onCopy} />
      <ToolbarButton icon={Trash2} label="Delete" onClick={onDelete} />
      {message.role === 'assistant' && (
        <ToolbarButton icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick}>
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom"><p>{label}</p></TooltipContent>
    </Tooltip>
  );
}
