'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ReasoningLevelPicker } from './ReasoningLevelPicker';
import { ClusterSwitcher } from './ClusterSwitcher';
import { AttachmentButton } from './AttachmentButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';

export function ChatWindow({ messages, streaming, onSend, onEdit, onDelete, onRegenerate }) {
  const [input, setInput] = useState('');
  const [reasoningLevel, setReasoningLevel] = useState('medium');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    onSend({ message: trimmed, reasoningLevel });
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <ClusterSwitcher />
        <ReasoningLevelPicker value={reasoningLevel} onChange={setReasoningLevel} />
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Start a conversation"
            description="Type a message to begin chatting with Cortex"
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onEdit={onEdit}
                onDelete={onDelete}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <AttachmentButton onAttach={() => {}} />
          <Textarea
            ref={textareaRef}
            placeholder="Message Cortex..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[150px] resize-none text-base"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="shrink-0 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
