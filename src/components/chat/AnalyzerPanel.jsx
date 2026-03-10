'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, BrainCircuit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLLAPSE_DELAY_MS = 5000;

/**
 * Dedicated panel that sits ABOVE the chat messages scroll area.
 * Shows the pre-analysis results: intent, modules, confidence, etc.
 *
 * States:
 *  - hidden: extra-analyze off or no analysis yet
 *  - analyzing: loading shimmer
 *  - complete: expanded with results
 *  - collapsed: single-line summary
 */
export function AnalyzerPanel({ analysisState, isStreaming }) {
  // analysisState: { status: 'idle' | 'analyzing' | 'complete', data: null | AnalysisResult }
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('analyzer_panel_collapsed') === 'true';
    }
    return false;
  });
  const autoCollapseRef = useRef(null);

  // Save collapse preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analyzer_panel_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  // Auto-collapse 5 seconds after main response starts streaming
  useEffect(() => {
    if (isStreaming && analysisState?.status === 'complete') {
      autoCollapseRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, COLLAPSE_DELAY_MS);
    }
    return () => {
      if (autoCollapseRef.current) clearTimeout(autoCollapseRef.current);
    };
  }, [isStreaming, analysisState?.status]);

  // Expand when new analysis arrives
  useEffect(() => {
    if (analysisState?.status === 'complete') {
      setIsCollapsed(false);
    }
  }, [analysisState?.status, analysisState?.data]);

  // Hidden state — no analysis running or enabled
  if (!analysisState || analysisState.status === 'idle') {
    return null;
  }

  // Analyzing state — loading shimmer
  if (analysisState.status === 'analyzing') {
    return (
      <div className="border-b bg-muted/30 transition-all duration-200 ease-out">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-xs text-muted-foreground animate-pulse">Analyzing message...</span>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        </div>
      </div>
    );
  }

  // Complete state
  const data = analysisState.data;
  if (!data) return null;

  const confidenceColor = data.confidence >= 80
    ? 'text-green-500'
    : data.confidence >= 50
      ? 'text-yellow-500'
      : 'text-red-500';

  const moduleList = (data.modules ?? []).filter(m => m !== 'none').join(', ') || 'none';
  const intentSummary = data.primary_intent ?? 'Unknown';
  const secondaryText = data.secondary_intents?.length > 0
    ? ` + ${data.secondary_intents.join(', ')}`
    : '';
  const analysisTimeStr = data.analysis_time_ms != null
    ? `${(data.analysis_time_ms / 1000).toFixed(1)}s`
    : '';

  // Collapsed state — single thin bar
  if (isCollapsed) {
    return (
      <div className="border-b bg-muted/30 transition-all duration-200 ease-out">
        <button
          onClick={() => setIsCollapsed(false)}
          className="max-w-4xl mx-auto px-4 py-1.5 flex items-center gap-2 w-full text-left hover:bg-muted/50 transition-colors"
        >
          <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {intentSummary}{secondaryText} &middot; {moduleList} &middot; <span className={confidenceColor}>{data.confidence}%</span>
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
        </button>
      </div>
    );
  }

  // Expanded state
  const memoryCount = data.memories_found ?? 0;
  const toolsLoaded = data.tools_loaded ?? 0;
  const toolsTotal = data.tools_total ?? 0;
  const preFetchedKeys = data.pre_fetched_keys ?? [];

  return (
    <div className="border-b bg-muted/30 transition-all duration-200 ease-out">
      <div className="max-w-4xl mx-auto px-4 py-2 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Analysis{analysisTimeStr ? ` (${analysisTimeStr})` : ''}
            </span>
          </div>
          <button onClick={() => setIsCollapsed(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Collapse <ChevronUp className="h-3 w-3" />
          </button>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
          <div>
            <span className="text-muted-foreground">Intent: </span>
            <span>{intentSummary}{secondaryText}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence: </span>
            <span className={cn('font-medium', confidenceColor)}>{data.confidence}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Modules: </span>
            <span>{moduleList}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tools: </span>
            <span>{toolsLoaded}/{toolsTotal} selected</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Context: </span>
            <span>
              {memoryCount} memories
              {preFetchedKeys.length > 0 ? ` · ${preFetchedKeys.join(', ')} loaded` : ''}
            </span>
          </div>
          {data.ambiguity && (
            <div className="col-span-2">
              <span className="text-amber-500 dark:text-amber-400">Ambiguity: </span>
              <span className="text-amber-600 dark:text-amber-300">{data.ambiguity}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
