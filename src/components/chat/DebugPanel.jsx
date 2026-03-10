'use client';

import { useState } from 'react';
import { Bug, ChevronDown, ChevronRight, X, Terminal, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DebugTerminalPanel — collapsible terminal-style panel that shows above messages.
 * Toggled by a Terminal icon button in the controls row.
 */
export function DebugTerminalPanel({ messages, streaming }) {
  const [activeSection, setActiveSection] = useState('server');

  // Extract debug info from the most recent assistant message that has it
  const lastAssistant = [...messages].reverse().find(
    (m) => m.role === 'assistant' && (m.debugInfo || m.toolRounds || m.tokenStats)
  );
  const debugInfo = lastAssistant?.debugInfo || null;
  const toolRounds = lastAssistant?.toolRounds || [];
  const tokenStats = lastAssistant?.tokenStats || null;

  const sections = [
    { id: 'server', label: 'Server Output' },
    { id: 'debug', label: 'Debug Info' },
    ...(toolRounds.length > 0 ? [{ id: 'tools', label: `Tool Rounds (${toolRounds.length})` }] : []),
    ...(tokenStats ? [{ id: 'tokens', label: 'Tokens' }] : []),
  ];

  return (
    <div className="bg-[#1a1a2e] text-green-400 border border-border rounded-md mx-4 mt-2 overflow-hidden font-mono text-xs">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16162a] border-b border-border/50">
        <Terminal className="h-3.5 w-3.5 text-green-500" />
        <span className="text-[11px] text-green-300 font-semibold">Debug Terminal</span>
        <div className="flex-1" />
        <Circle className={cn('h-2 w-2', streaming ? 'text-yellow-400 animate-pulse fill-yellow-400' : 'text-green-500 fill-green-500')} />
        <span className="text-[10px] text-gray-400">{streaming ? 'streaming...' : 'idle'}</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/30 px-2 gap-1 bg-[#16162a]/50">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'px-2 py-1 text-[10px] border-b transition-colors',
              activeSection === s.id
                ? 'border-green-400 text-green-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="p-3 max-h-[200px] overflow-auto">
        {activeSection === 'server' && (
          <div className="space-y-1">
            <Line label="Status" value={streaming ? 'Streaming response...' : 'Ready'} />
            <Line label="Backend" value={debugInfo?.model ? `Model: ${debugInfo.model}` : 'Waiting for response'} />
            {debugInfo && (
              <>
                <Line label="System prompt" value={`${debugInfo.systemPrompt?.length || 0} chars`} />
                <Line label="Messages in context" value={String(debugInfo.messagesCount || 0)} />
              </>
            )}
            {streaming && (
              <div className="text-yellow-400 mt-2">
                <span className="animate-pulse">{'>'}</span> Receiving chunks...
              </div>
            )}
            {!streaming && !debugInfo && (
              <div className="text-gray-500 mt-1">No server output yet. Send a message to see debug info.</div>
            )}
          </div>
        )}

        {activeSection === 'debug' && (
          <div className="space-y-1">
            {debugInfo ? (
              <>
                <Line label="Model" value={debugInfo.model || 'unknown'} />
                <Line label="System prompt length" value={`${debugInfo.systemPrompt?.length || 0} chars`} />
                <Line label="Messages count" value={String(debugInfo.messagesCount || 0)} />
                {debugInfo.projectPrompt && (
                  <Line label="Project prompt" value={`${debugInfo.projectPrompt.length} chars`} />
                )}
                <div className="mt-2 text-gray-500">--- Full system prompt ---</div>
                <pre className="text-[10px] text-green-300/70 whitespace-pre-wrap mt-1 max-h-[100px] overflow-auto">
                  {debugInfo.systemPrompt || '(none)'}
                </pre>
              </>
            ) : (
              <div className="text-gray-500">No debug info available yet.</div>
            )}
          </div>
        )}

        {activeSection === 'tools' && toolRounds.length > 0 && (
          <div className="space-y-2">
            {toolRounds.map((round) => (
              <ToolRoundTerminal key={round.round} round={round} />
            ))}
          </div>
        )}

        {activeSection === 'tokens' && tokenStats && (
          <div className="space-y-1">
            {Object.entries(tokenStats).map(([key, value]) => (
              <Line key={key} label={key.replace(/_/g, ' ')} value={typeof value === 'number' ? value.toLocaleString() : String(value)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500">{label}:</span>
      <span className="text-green-300">{value}</span>
    </div>
  );
}

function ToolRoundTerminal({ round }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border/30 rounded">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1 text-[10px] hover:bg-white/5 transition-colors"
      >
        {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        <span className="text-green-400">Round {round.round}</span>
        <span className="text-gray-500">{round.messages?.length || 0} messages</span>
      </button>
      {expanded && (
        <div className="px-2 pb-2 space-y-1 max-h-[120px] overflow-auto">
          {round.messages?.map((msg, i) => (
            <div key={i} className="text-[10px]">
              <span className={cn(
                'font-semibold',
                msg.role === 'system' ? 'text-blue-400' :
                msg.role === 'user' ? 'text-cyan-400' :
                msg.role === 'assistant' ? 'text-purple-400' :
                msg.role === 'tool' ? 'text-orange-400' : 'text-gray-400'
              )}>
                [{msg.role}]
              </span>
              {' '}
              <span className="text-green-300/60">
                {msg.content ? (msg.content.length > 200 ? msg.content.slice(0, 200) + '...' : msg.content) : '(empty)'}
              </span>
              {msg.tool_calls && (
                <span className="text-orange-300 ml-1">called: {msg.tool_calls.join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Original per-message DebugPanel — modal inspector triggered from message bubble.
 * Kept for backward compatibility.
 */
export function DebugPanel({ debugInfo, toolRounds, tokenStats }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('system');

  if (!debugInfo && !toolRounds?.length && !tokenStats) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        title="Debug info"
      >
        <Bug className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-background border rounded-lg shadow-xl w-[90vw] max-w-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <span className="font-semibold text-sm">Debug Inspector</span>
                {debugInfo?.model && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{debugInfo.model}</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="hover:bg-accent p-1 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-4 gap-1">
              {[
                { id: 'system', label: 'System Prompt' },
                { id: 'project', label: 'Project Prompt' },
                ...(toolRounds?.length ? [{ id: 'tools', label: `Tool Rounds (${toolRounds.length})` }] : []),
                ...(tokenStats ? [{ id: 'tokens', label: 'Tokens' }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'system' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Full System Prompt</span>
                    <span className="text-xs text-muted-foreground">{debugInfo?.messagesCount || 0} messages in context</span>
                  </div>
                  <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap overflow-auto max-h-[50vh]">
                    {debugInfo?.systemPrompt || 'No system prompt available'}
                  </pre>
                </div>
              )}

              {activeTab === 'project' && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Project Prompt</span>
                  {debugInfo?.projectPrompt ? (
                    <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap overflow-auto max-h-[50vh]">
                      {debugInfo.projectPrompt}
                    </pre>
                  ) : (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                      No project prompt injected for this message. Either no project is selected, or the project has no system prompt configured.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tools' && toolRounds && (
                <div className="space-y-4">
                  {toolRounds.map((round) => (
                    <ToolRoundSection key={round.round} round={round} />
                  ))}
                </div>
              )}

              {activeTab === 'tokens' && tokenStats && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Token Usage</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(tokenStats).map(([key, value]) => (
                      <div key={key} className="bg-muted p-2 rounded text-xs">
                        <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <div className="font-mono font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToolRoundSection({ round }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-muted/50 hover:bg-muted transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-semibold">Round {round.round}</span>
        <span className="text-muted-foreground">{round.messages?.length || 0} messages sent to model</span>
      </button>
      {expanded && (
        <div className="p-3 space-y-2 max-h-[40vh] overflow-auto">
          {round.messages?.map((msg, i) => (
            <div key={i} className={cn(
              'p-2 rounded text-xs font-mono',
              msg.role === 'system' ? 'bg-blue-500/10' :
              msg.role === 'user' ? 'bg-green-500/10' :
              msg.role === 'assistant' ? 'bg-purple-500/10' :
              msg.role === 'tool' ? 'bg-orange-500/10' : 'bg-muted'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{msg.role}</span>
                {msg.tool_calls && (
                  <span className="text-muted-foreground">called: {msg.tool_calls.join(', ')}</span>
                )}
              </div>
              <div className="whitespace-pre-wrap break-all opacity-80">
                {msg.content || '(empty)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
