'use client';

import { cn } from '@/lib/utils';

export function StreamingText({ content, isStreaming }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <div className="whitespace-pre-wrap">{content}</div>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-0.5" />
      )}
    </div>
  );
}
