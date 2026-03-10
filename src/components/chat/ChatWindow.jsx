'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Send, Settings2, Paperclip, X, FileText } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ReasoningLevelPicker } from './ReasoningLevelPicker';
import { ToolToggle } from './ToolToggle';
import { ProjectSelector } from './ProjectSelector';
import { SystemPromptEditor } from './SystemPromptEditor';
import { ClusterSwitcher } from './ClusterSwitcher';
import { TokenAnalytics } from './TokenAnalytics';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';

export function ChatWindow({ messages, streaming, onSend, onEdit, onDelete, onRegenerate, modelName, conversationId, conversationMeta }) {
  const [input, setInput] = useState('');
  const [reasoningLevel, setReasoningLevel] = useState('medium');
  const [enabledTools, setEnabledTools] = useState({ web_search: true, tools: true });
  const [attachments, setAttachments] = useState([]);
  const [chatSettings, setChatSettings] = useState({ temperature: 0.7, contextWindow: 4096 });
  const [projectId, setProjectId] = useState(conversationMeta?.project_id || null);
  const [systemPromptOverride, setSystemPromptOverride] = useState(conversationMeta?.system_prompt_override || '');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync projectId and systemPromptOverride when conversation changes
  useEffect(() => {
    setProjectId(conversationMeta?.project_id || null);
    setSystemPromptOverride(conversationMeta?.system_prompt_override || '');
  }, [conversationMeta]);

  function scrollToBottom() {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    onSend({
      message: trimmed,
      reasoningLevel,
      enabledTools,
      attachments,
      temperature: chatSettings.temperature,
      contextWindow: chatSettings.contextWindow,
      projectId,
      systemPromptOverride: systemPromptOverride || undefined,
    });
    setInput('');
    setAttachments([]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleToolToggle(id, enabled) {
    setEnabledTools(prev => ({ ...prev, [id]: enabled }));
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} attached`);
    }
    e.target.value = '';
  }

  function removeAttachment(index) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar - cluster switcher + token analytics */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <ClusterSwitcher />
        <TokenAnalytics messages={messages} chatSettings={chatSettings} />
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

      {/* Bottom input area */}
      <div className="border-t px-4 py-3">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1 text-xs">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-1 flex-wrap">
            <ReasoningLevelPicker value={reasoningLevel} onChange={setReasoningLevel} modelName={modelName} />
            <ToolToggle enabledTools={enabledTools} onToggle={handleToolToggle} />
            <ProjectSelector conversationId={conversationId} currentProjectId={projectId} onProjectChange={setProjectId} />
            <SystemPromptEditor conversationId={conversationId} value={systemPromptOverride} onChange={setSystemPromptOverride} />
            <ChatSettingsPopover settings={chatSettings} onChange={setChatSettings} />
          </div>

          {/* Input row */}
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.csv,.xlsx,.txt,.md,.json"
              onChange={handleFileSelect}
            />
            <Textarea
              ref={textareaRef}
              placeholder="Message Cortex..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[40px] max-h-[150px] resize-none"
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
    </div>
  );
}

function ChatSettingsPopover({ settings, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4" align="start" side="top">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat Settings</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Temperature</Label>
            <span className="text-xs text-muted-foreground">{settings.temperature.toFixed(1)}</span>
          </div>
          <Slider
            value={[settings.temperature]}
            onValueChange={([v]) => onChange({ ...settings, temperature: v })}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground">Lower = focused, Higher = creative</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Context Window</Label>
            <span className="text-xs text-muted-foreground">{settings.contextWindow}</span>
          </div>
          <Slider
            value={[settings.contextWindow]}
            onValueChange={([v]) => onChange({ ...settings, contextWindow: v })}
            min={1024}
            max={131072}
            step={1024}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground">Max tokens for context</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
