'use client';

import { useState } from 'react';
import { Bug, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
