'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const STUCK_TIMEOUT_MS = 120_000; // 2 minutes

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationMeta, setConversationMeta] = useState(null);
  const [analysisState, setAnalysisState] = useState({ status: 'idle', data: null });
  const abortRef = useRef(null);
  const stuckTimeoutRef = useRef(null);
  const stuckWarningShownRef = useRef(false);

  // Clear stuck timeout on unmount
  useEffect(() => {
    return () => {
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
    };
  }, []);

  function resetStuckTimer() {
    if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
    stuckWarningShownRef.current = false;
    stuckTimeoutRef.current = setTimeout(() => {
      if (!stuckWarningShownRef.current) {
        stuckWarningShownRef.current = true;
        toast.warning('Response seems stuck. You may want to try again.');
      }
    }, STUCK_TIMEOUT_MS);
  }

  function clearStuckTimer() {
    if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
    stuckTimeoutRef.current = null;
    stuckWarningShownRef.current = false;
  }

  const loadConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversationId(id);
        setConversationMeta(data.conversation || null);
      }
    } catch {
      toast.error('Failed to load conversation');
    }
  }, []);

  const sendMessage = useCallback(async ({ message, model, reasoningLevel, thinkingTemplate, enabledTools, attachments, samplingParams, projectId, systemPromptOverride, extraAnalyze }) => {
    setStreaming(true);

    // Set analysis state to analyzing if extra-analyze is enabled
    if (extraAnalyze) {
      setAnalysisState({ status: 'analyzing', data: null });
    } else {
      setAnalysisState({ status: 'idle', data: null });
    }

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: message };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Upload attachments first if any
      let attachmentTexts = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('files', file);
          formData.append('category', 'chat');
          await fetch('/api/upload', { method: 'POST', body: formData }).catch(() => {});
          // For text files, read content to include in message
          if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json)$/i)) {
            try {
              const text = await file.text();
              attachmentTexts.push(`[File: ${file.name}]\n${text}`);
            } catch { /* skip */ }
          } else {
            attachmentTexts.push(`[Attached file: ${file.name} (${file.type})]`);
          }
        }
      }

      const fullMessage = attachmentTexts.length > 0
        ? `${message}\n\n---\n${attachmentTexts.join('\n\n')}`
        : message;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: fullMessage,
          model,
          reasoningLevel,
          thinkingTemplate,
          enabledTools,
          samplingParams,
          projectId,
          systemPromptOverride,
          extraAnalyze: extraAnalyze || false,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let thinkingContent = '';
      let assistantId = crypto.randomUUID();
      let buffer = '';
      let debugInfo = null;
      let toolRounds = [];

      // Start stuck-loading detection
      resetStuckTimer();

      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', thinking: '', streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') break;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'analysis_result') {
              // Update the analyzer panel with results
              setAnalysisState({ status: 'complete', data: event.data });
            } else if (event.type === 'debug') {
              debugInfo = { systemPrompt: event.systemPrompt, messagesCount: event.messagesCount, projectPrompt: event.projectPrompt, model: event.model };
            } else if (event.type === 'debug_tool_round') {
              toolRounds.push({ round: event.round, messages: event.messages });
            } else if (event.type === 'thinking') {
              thinkingContent += event.content;
              resetStuckTimer();
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, thinking: thinkingContent } : m)
              );
            } else if (event.type === 'content') {
              assistantContent += event.content;
              resetStuckTimer();
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
              if (event.conversationId) setConversationId(event.conversationId);
            } else if (event.type === 'tool_call') {
              setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'tool', tool_name: event.name, tool_args: event.arguments, content: 'Calling tool...' }]);
            } else if (event.type === 'tool_result') {
              setMessages((prev) => {
                const idx = prev.findLastIndex((m) => m.role === 'tool' && m.tool_name === event.name);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], content: JSON.stringify(event.result), tool_result: event.result };
                  return updated;
                }
                return prev;
              });
              // Reset assistant content for the follow-up response
              assistantContent = '';
              thinkingContent = '';
              assistantId = crypto.randomUUID();
              setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', thinking: '', streaming: true }]);
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false, tokenStats: event.tokenStats || null, debugInfo, toolRounds: toolRounds.length > 0 ? toolRounds : undefined } : m)
              );
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.streaming ? { ...m, streaming: false } : m)
      );
    } catch {
      const backendHint = 'Failed to get response. Check that your LLM backend (Ollama or llama-server) is running and reachable in Settings > Backend.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: backendHint, error: true }]);
      toast.error('Failed to get response from LLM backend');
      // Reset analysis state on error
      if (extraAnalyze) {
        setAnalysisState({ status: 'idle', data: null });
      }
    } finally {
      clearStuckTimer();
      setStreaming(false);
    }
  }, [conversationId]);

  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, newContent }),
      });
      if (res.ok && conversationId) {
        await loadConversation(conversationId);
        toast.success('Message updated');
      }
    } catch {
      toast.error('Failed to edit message');
    }
  }, [conversationId, loadConversation]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (res.ok && conversationId) {
        await loadConversation(conversationId);
        toast.success('Message deleted');
      }
    } catch {
      toast.error('Failed to delete message');
    }
  }, [conversationId, loadConversation]);

  const regenerate = useCallback(async (messageId, reasoningLevel) => {
    try {
      const res = await fetch('/api/chat/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reasoningLevel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) {
          await loadConversation(data.conversationId);
          const lastUser = messages.filter((m) => m.role === 'user').pop();
          if (lastUser) {
            await sendMessage({ message: lastUser.content, reasoningLevel: data.reasoningLevel });
          }
        }
      }
    } catch {
      toast.error('Failed to regenerate');
    }
  }, [messages, loadConversation, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationMeta(null);
    setAnalysisState({ status: 'idle', data: null });
  }, []);

  return {
    messages, streaming, conversationId, conversationMeta, analysisState,
    sendMessage, editMessage, deleteMessage, regenerate,
    loadConversation, clearChat, setConversationId,
  };
}
