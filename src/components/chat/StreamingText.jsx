'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

function parseThinking(content) {
  if (!content) return { thinking: '', response: '' };

  // Match <think>...</think> blocks (including multiline)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  const thinkBlocks = [];
  let match;
  while ((match = thinkRegex.exec(content)) !== null) {
    thinkBlocks.push(match[1].trim());
  }

  // Remove think blocks from the response
  const response = content.replace(thinkRegex, '').trim();
  const thinking = thinkBlocks.join('\n\n');

  return { thinking, response };
}

function ThinkingBlock({ thinking }) {
  const [expanded, setExpanded] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Brain className="h-3 w-3 text-purple-500" />
        <span className="font-medium">Thinking</span>
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {!expanded && (
          <span className="text-[10px] opacity-60 truncate max-w-[200px]">
            {thinking.slice(0, 80)}{thinking.length > 80 ? '...' : ''}
          </span>
        )}
      </button>
      {expanded && (
        <div className="mt-1 pl-3 border-l-2 border-purple-500/30 text-xs text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  );
}

export function StreamingText({ content, isStreaming, isUser }) {
  if (!content) return null;

  if (isUser) {
    return (
      <div className="whitespace-pre-wrap text-sm break-words">{content}</div>
    );
  }

  const { thinking, response } = useMemo(() => parseThinking(content), [content]);

  return (
    <div className="text-sm break-words">
      <ThinkingBlock thinking={thinking} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ inline, className, children }) => {
            if (inline) {
              return <code className="px-1 py-0.5 rounded bg-background/50 text-xs font-mono">{children}</code>;
            }
            return (
              <pre className="my-2 p-3 rounded-md bg-background/50 overflow-x-auto">
                <code className="text-xs font-mono">{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-2 italic text-muted-foreground">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1 border-t">{children}</td>,
        }}
      >
        {response || content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-foreground animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
