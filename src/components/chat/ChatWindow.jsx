'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Send, Settings2, Paperclip, X, FileText, ChevronDown, RotateCcw, BrainCircuit, Terminal } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ReasoningLevelPicker } from './ReasoningLevelPicker';
import { ToolToggle } from './ToolToggle';
import { ProjectSelector } from './ProjectSelector';
import { SystemPromptEditor } from './SystemPromptEditor';
import { ClusterSwitcher } from './ClusterSwitcher';
import { TokenAnalytics } from './TokenAnalytics';
import { AnalyzerPanel } from './AnalyzerPanel';
import { DebugTerminalPanel } from './DebugPanel';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';
import { SAMPLING_PARAMS, PARAM_GROUPS, getDefaults, buildOllamaOptions } from '@/lib/sampling-params';
import { cn } from '@/lib/utils';

export function ChatWindow({ messages, streaming, onSend, onEdit, onDelete, onRegenerate, modelName, conversationId, conversationMeta, analysisState }) {
  const [input, setInput] = useState('');
  const [reasoningLevel, setReasoningLevel] = useState('medium');
  const [thinkingTemplate, setThinkingTemplate] = useState('auto');
  const [enabledTools, setEnabledTools] = useState({ web_search: true, tools: true });
  const [attachments, setAttachments] = useState([]);
  const [chatSettings, setChatSettings] = useState(getDefaults);
  const [projectId, setProjectId] = useState(conversationMeta?.project_id || null);
  const [systemPromptOverride, setSystemPromptOverride] = useState(conversationMeta?.system_prompt_override || '');
  const [debugOpen, setDebugOpen] = useState(false);
  const [extraAnalyze, setExtraAnalyze] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('extra_analyze_enabled');
      return stored !== null ? stored === 'true' : true; // default ON
    }
    return true;
  });
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Persist extraAnalyze preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extra_analyze_enabled', String(extraAnalyze));
    }
  }, [extraAnalyze]);

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
      thinkingTemplate,
      enabledTools,
      attachments,
      samplingParams: buildOllamaOptions(chatSettings),
      projectId,
      systemPromptOverride: systemPromptOverride || undefined,
      extraAnalyze,
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

      {/* Analyzer Panel — dedicated region above messages */}
      {extraAnalyze && <AnalyzerPanel analysisState={analysisState} isStreaming={streaming} />}

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
            <ReasoningLevelPicker value={reasoningLevel} onChange={setReasoningLevel} thinkingTemplate={thinkingTemplate} onTemplateChange={setThinkingTemplate} />
            <ToolToggle enabledTools={enabledTools} onToggle={handleToolToggle} />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setExtraAnalyze(prev => !prev)}
            >
              <BrainCircuit className={cn('h-3.5 w-3.5', extraAnalyze ? 'text-violet-500' : 'text-muted-foreground')} />
              <span className="text-xs hidden sm:inline">Analyze</span>
              <Switch checked={extraAnalyze} onCheckedChange={setExtraAnalyze} className="scale-75 ml-0.5" />
            </Button>
            <ProjectSelector conversationId={conversationId} currentProjectId={projectId} onProjectChange={setProjectId} />
            <SystemPromptEditor conversationId={conversationId} value={systemPromptOverride} onChange={setSystemPromptOverride} />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setDebugOpen(prev => !prev)}
              title="Toggle debug terminal"
            >
              <Terminal className={cn('h-3.5 w-3.5', debugOpen ? 'text-green-500' : 'text-muted-foreground')} />
              <span className="text-xs hidden sm:inline">Debug</span>
            </Button>
            <ChatSettingsPopover settings={chatSettings} onChange={setChatSettings} />
          </div>

          {/* Debug terminal panel */}
          {debugOpen && <DebugTerminalPanel messages={messages} streaming={streaming} />}

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

function ParamSlider({ param, value, onChange }) {
  const display = Number.isInteger(param.step) ? value : value.toFixed(2);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{param.label}</Label>
        <span className="text-xs text-muted-foreground font-mono">{display}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={param.min} max={param.max} step={param.step} className="w-full" />
      <p className="text-[10px] text-muted-foreground">{param.desc}</p>
    </div>
  );
}

function ParamNumber({ param, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{param.label}</Label>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={param.min}
        max={param.max}
        step={param.step}
        className="h-7 text-xs"
      />
      <p className="text-[10px] text-muted-foreground">{param.desc}</p>
    </div>
  );
}

function ParamSelect({ param, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{param.label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {param.options.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground">{param.desc}</p>
    </div>
  );
}

function ParamTags({ param, value, onChange }) {
  const [input, setInput] = useState('');
  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{param.label}</Label>
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add stop sequence..."
          className="h-7 text-xs flex-1"
        />
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addTag}>Add</Button>
      </div>
      {value.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {value.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-muted rounded px-1.5 py-0.5 text-[10px] font-mono">
              {tag}
              <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">{param.desc}</p>
    </div>
  );
}

function ParamText({ param, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{param.label}</Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.default || ''}
        className="h-7 text-xs"
      />
      <p className="text-[10px] text-muted-foreground">{param.desc}</p>
    </div>
  );
}

function ParamToggle({ param, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-xs">{param.label}</Label>
        <p className="text-[10px] text-muted-foreground">{param.desc}</p>
      </div>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </div>
  );
}

function ParamControl({ param, value, onChange }) {
  if (param.type === 'slider') return <ParamSlider param={param} value={value} onChange={onChange} />;
  if (param.type === 'number') return <ParamNumber param={param} value={value} onChange={onChange} />;
  if (param.type === 'select') return <ParamSelect param={param} value={value} onChange={onChange} />;
  if (param.type === 'toggle') return <ParamToggle param={param} value={value} onChange={onChange} />;
  if (param.type === 'text')   return <ParamText param={param} value={value} onChange={onChange} />;
  if (param.type === 'tags')   return <ParamTags param={param} value={value} onChange={onChange} />;
  return null;
}

function ChatSettingsPopover({ settings, onChange }) {
  const defaults = getDefaults();
  const isModified = Object.keys(defaults).some((k) => {
    if (Array.isArray(defaults[k])) return settings[k]?.length > 0;
    return settings[k] !== defaults[k];
  });

  const paramsByGroup = {};
  for (const p of Object.values(SAMPLING_PARAMS)) {
    if (!paramsByGroup[p.group]) paramsByGroup[p.group] = [];
    paramsByGroup[p.group].push(p);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Settings</span>
          {isModified && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <ScrollArea className="max-h-[420px]">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat Settings</p>
              {isModified && (
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => onChange(defaults)}>
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              )}
            </div>

            {PARAM_GROUPS.map((group) => {
              const params = paramsByGroup[group.id];
              if (!params) return null;

              if (group.id === 'advanced') {
                return (
                  <Collapsible key={group.id}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
                      <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-180" />
                      {group.label}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      {params.map((p) => (
                        <ParamControl
                          key={p.key}
                          param={p}
                          value={settings[p.key] ?? p.default}
                          onChange={(v) => onChange({ ...settings, [p.key]: v })}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <div key={group.id} className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
                  {params.map((p) => (
                    <ParamControl
                      key={p.key}
                      param={p}
                      value={settings[p.key] ?? p.default}
                      onChange={(v) => onChange({ ...settings, [p.key]: v })}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
