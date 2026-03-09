'use client';

import { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { truncate } from '@/lib/utils/format';

export function ToolCallDisplay({ toolName, toolArgs, content, toolResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-muted/50 hover:bg-muted transition-colors"
      >
        <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium">{toolName}</span>
        <span className="text-muted-foreground flex-1 text-left">
          {truncate(JSON.stringify(toolArgs), 50)}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="p-3 text-xs space-y-2 bg-background">
          <div>
            <span className="font-medium">Arguments:</span>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
              {JSON.stringify(toolArgs, null, 2)}
            </pre>
          </div>
          {toolResult && (
            <div>
              <span className="font-medium">Result:</span>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
