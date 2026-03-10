'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StreamingText } from './StreamingText';
import { ToolCallDisplay } from './ToolCallDisplay';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export function MessageBubble({ message, onEdit, onDelete, onRegenerate }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  if (message.role === 'tool') {
    return (
      <ToolCallDisplay
        toolName={message.tool_name}
        toolArgs={message.tool_args}
        content={message.content}
        toolResult={message.tool_result}
      />
    );
  }

  const isUser = message.role === 'user';

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveEdit() {
    onEdit(message.id, editContent);
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditContent(message.content);
    setEditing(false);
  }

  return (
    <div className={cn('group flex gap-3 py-2', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'relative max-w-[85%] lg:max-w-[70%] rounded-lg px-4 py-3',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {/* Info badges - only show when relevant */}
        {(message.edited || (message.reasoning_level && message.reasoning_level !== 'medium')) && (
          <div className="flex gap-1 mb-1.5">
            {message.edited ? <Badge variant="outline" className="text-[10px] py-0 h-4">edited</Badge> : null}
            {message.reasoning_level && message.reasoning_level !== 'medium' ? (
              <Badge variant="secondary" className="text-[10px] py-0 h-4">{message.reasoning_level}</Badge>
            ) : null}
          </div>
        )}

        {editing ? (
          <div className="space-y-2">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <StreamingText content={message.content} isStreaming={message.streaming} isUser={isUser} />
        )}

        {/* Copy button - always visible on right side */}
        {!editing && !message.streaming && message.content && (
          <button
            onClick={handleCopy}
            className={cn(
              'absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              isUser ? 'hover:bg-primary-foreground/20' : 'hover:bg-accent'
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
