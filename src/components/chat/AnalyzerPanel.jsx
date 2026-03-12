'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, BrainCircuit, Loader2, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Analyzer panel — sits above chat messages.
 *
 * States:
 *  - idle: hidden
 *  - streaming: live thinking + content from the analysis LLM call
 *  - complete: structured results + toggleable raw output
 *  - failed: error message, persists until next analysis
 */
export function AnalyzerPanel({ analysisState }) {
  const [showRaw, setShowRaw] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const streamRef = useRef(null);

  // Auto-scroll the streaming area
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [analysisState?.thinking, analysisState?.content]);

  // Expand when new analysis starts or completes
  useEffect(() => {
    if (analysisState?.status === 'streaming' || analysisState?.status === 'complete') {
      setIsCollapsed(false);
    }
  }, [analysisState?.status]);

  if (!analysisState || analysisState.status === 'idle') return null;

  const { status, thinking, content, data, error } = analysisState;
  const isStreaming = status === 'streaming';
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';
  const hasStreamText = !!(thinking || content);

  // --- Collapsed bar ---
  if (isCollapsed) {
    const summary = isComplete && data
      ? `${data.primary_intent || 'Analyzed'} \u00b7 ${(data.modules || []).filter(m => m !== 'none').join(', ') || 'none'} \u00b7 ${data.confidence ?? 0}%`
      : isFailed ? `Failed: ${error || 'Unknown'}` : 'Analyzing...';

    return (
      <div className="border-b bg-muted/30">
        <button onClick={() => setIsCollapsed(false)} className="max-w-4xl mx-auto px-4 py-1.5 flex items-center gap-2 w-full text-left hover:bg-muted/50 transition-colors">
          <BrainCircuit className={cn('h-3.5 w-3.5 shrink-0', isStreaming && 'animate-pulse text-violet-500', isComplete && 'text-green-500', isFailed && 'text-red-500')} />
          <span className="text-xs text-muted-foreground truncate">{summary}</span>
          {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto shrink-0" />}
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
        </button>
      </div>
    );
  }

  // --- Expanded panel ---
  return (
    <div className="border-b bg-muted/30 transition-all duration-200">
      <div className="max-w-4xl mx-auto px-4 py-2 space-y-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className={cn('h-4 w-4', isStreaming && 'animate-pulse text-violet-500', isComplete && 'text-green-500', isFailed && 'text-red-500')} />
            <span className="text-xs font-medium text-muted-foreground">
              {isStreaming ? 'Analyzing...' : isComplete ? `Analysis (${((data?.analysis_time_ms || 0) / 1000).toFixed(1)}s)` : 'Analysis Failed'}
            </span>
            {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {isComplete && <Check className="h-3 w-3 text-green-500" />}
            {isFailed && <AlertCircle className="h-3 w-3 text-red-500" />}
          </div>
          <div className="flex items-center gap-1">
            {hasStreamText && isComplete && (
              <button onClick={() => setShowRaw(!showRaw)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted">
                {showRaw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showRaw ? 'Hide' : 'Raw'}
              </button>
            )}
            <button onClick={() => setIsCollapsed(true)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted">
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Streaming view — live thinking + content */}
        {(isStreaming || showRaw) && hasStreamText && (
          <div
            ref={streamRef}
            className="bg-black/5 dark:bg-white/5 rounded-md p-2 max-h-36 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1"
          >
            {thinking && (
              <div className="text-muted-foreground/70 italic whitespace-pre-wrap">{thinking}</div>
            )}
            {content && (
              <div className="text-foreground/80 whitespace-pre-wrap">{content}</div>
            )}
            {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-violet-500 animate-pulse rounded-sm" />}
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <p className="text-xs text-red-500/80">{error || 'Analysis failed. Falling back to standard flow.'}</p>
        )}

        {/* Complete state — structured results grid */}
        {isComplete && data && !data.failed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
            <div>
              <span className="text-muted-foreground">Intent: </span>
              <span>{data.primary_intent || 'Unknown'}{data.secondary_intents?.length > 0 ? ` + ${data.secondary_intents.join(', ')}` : ''}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence: </span>
              <span className={cn('font-medium', (data.confidence ?? 0) >= 80 ? 'text-green-500' : (data.confidence ?? 0) >= 50 ? 'text-yellow-500' : 'text-red-500')}>{data.confidence ?? 0}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Modules: </span>
              <span>{(data.modules ?? []).filter(m => m !== 'none').join(', ') || 'none'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tools: </span>
              <span>{data.tools_loaded ?? 0}/{data.tools_total ?? 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Memories: </span>
              <span>{data.memories_found ?? 0}</span>
            </div>
            {(data.pre_fetched_keys ?? []).length > 0 && (
              <div>
                <span className="text-muted-foreground">Pre-fetched: </span>
                <span>{data.pre_fetched_keys.join(', ')}</span>
              </div>
            )}
            {data.ambiguity && (
              <div className="col-span-full">
                <span className="text-amber-500">{data.ambiguity}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
