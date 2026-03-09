'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StreamingText } from './StreamingText';
import { MessageToolbar } from './MessageToolbar';
import { ToolCallDisplay } from './ToolCallDisplay';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function MessageBubble({ message, onEdit, onDelete, onRegenerate }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

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
      <div className={cn('max-w-[85%] lg:max-w-[70%] rounded-lg px-4 py-3', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        {message.edited && <Badge variant="outline" className="mb-1 text-[10px]">edited</Badge>}
        {message.reasoning_level && message.reasoning_level !== 'medium' && (
          <Badge variant="secondary" className="mb-1 text-[10px] mr-1">{message.reasoning_level}</Badge>
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
          <StreamingText content={message.content} isStreaming={message.streaming} />
        )}

        {!editing && !message.streaming && (
          <div className="mt-1">
            <MessageToolbar
              message={message}
              onEdit={() => setEditing(true)}
              onDelete={() => onDelete(message.id)}
              onCopy={handleCopy}
              onRegenerate={() => onRegenerate(message.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
