'use client';

import { useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Zap, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { DEFAULT_CONTEXT_WINDOW } from '@/lib/constants';

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(ms) {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function TokenAnalytics({ messages, chatSettings }) {
  const stats = useMemo(() => {
    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalDuration = 0;
    let lastTps = 0;
    let messagesWithStats = 0;

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;

      // Try to parse token stats from the message
      let tokenData = null;
      if (msg.tokens_used) {
        try {
          tokenData = typeof msg.tokens_used === 'string' ? JSON.parse(msg.tokens_used) : msg.tokens_used;
        } catch { /* skip */ }
      }
      // Also check live streaming stats
      if (msg.tokenStats) {
        tokenData = msg.tokenStats;
      }

      if (tokenData) {
        totalPrompt += tokenData.prompt_tokens || 0;
        totalCompletion += tokenData.completion_tokens || 0;
        totalDuration += tokenData.total_duration_ms || 0;
        if (tokenData.tokens_per_second) lastTps = tokenData.tokens_per_second;
        messagesWithStats++;
      }
    }

    // Use the last message's prompt_tokens for context usage (not cumulative total)
    let lastPromptTokens = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;
      let td = null;
      if (msg.tokenStats) td = msg.tokenStats;
      else if (msg.tokens_used) {
        try { td = typeof msg.tokens_used === 'string' ? JSON.parse(msg.tokens_used) : msg.tokens_used; } catch { /* skip */ }
      }
      if (td?.prompt_tokens) { lastPromptTokens = td.prompt_tokens; break; }
    }

    const contextWindow = chatSettings?.num_ctx || DEFAULT_CONTEXT_WINDOW;
    return {
      totalPrompt,
      totalCompletion,
      totalTokens: totalPrompt + totalCompletion,
      totalDuration,
      lastTps,
      messagesWithStats,
      contextWindow,
      lastPromptTokens,
      contextUsedPercent: lastPromptTokens > 0 ? Math.min(100, Math.round((lastPromptTokens / contextWindow) * 100)) : 0,
    };
  }, [messages, chatSettings]);

  if (stats.totalTokens === 0 && stats.messagesWithStats === 0) {
    return (
      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" disabled>
        <BarChart3 className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">0 tokens</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">{formatNum(stats.totalTokens)} tokens</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Token Analytics</p>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ArrowUp className="h-3.5 w-3.5 text-blue-500" />}
            label="Prompt"
            value={formatNum(stats.totalPrompt)}
          />
          <StatCard
            icon={<ArrowDown className="h-3.5 w-3.5 text-green-500" />}
            label="Completion"
            value={formatNum(stats.totalCompletion)}
          />
          <StatCard
            icon={<Zap className="h-3.5 w-3.5 text-yellow-500" />}
            label="Speed"
            value={stats.lastTps ? `${stats.lastTps} t/s` : '—'}
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5 text-purple-500" />}
            label="Total Time"
            value={stats.totalDuration ? formatDuration(stats.totalDuration) : '—'}
          />
        </div>

        <Separator className="my-3" />

        {/* Context window usage bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Context Window</span>
            <span className="font-medium">{formatNum(stats.lastPromptTokens)} / {formatNum(stats.contextWindow)}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stats.contextUsedPercent > 80 ? 'bg-red-500' : stats.contextUsedPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${stats.contextUsedPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">{stats.contextUsedPercent}% used</p>
        </div>

        <Separator className="my-3" />

        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Tokens</span>
          <span className="font-bold">{stats.totalTokens.toLocaleString()}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-muted/50 rounded-md px-3 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
