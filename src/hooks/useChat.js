'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const STUCK_TIMEOUT_MS = 120_000; // 2 minutes

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const conversationIdRef = useRef(null);
  const [conversationMeta, setConversationMeta] = useState(null);
  const [analysisState, setAnalysisState] = useState({ status: 'idle', thinking: '', content: '', data: null, error: null });
  const abortRef = useRef(null);
  const stuckTimeoutRef = useRef(null);
  const stuckWarningShownRef = useRef(false);

  // Keep conversationId ref in sync so callbacks always read the latest value
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Clear stuck timeout and abort any active stream on unmount
  useEffect(() => {
    return () => {
      if (stuckTimeoutRef.current) clearTimeout(stuckTimeoutRef.current);
      abortRef.current?.abort();
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

  const sendMessage = useCallback(async ({ message, model, reasoningLevel, enabledTools, attachments, samplingParams, projectId, systemPromptOverride, extraAnalyze }) => {
    setStreaming(true);

    // Reset analysis state for this new message
    if (extraAnalyze) {
      setAnalysisState({ status: 'idle', thinking: '', content: '', data: null, error: null });
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

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          message: fullMessage,
          model,
          reasoningLevel,
          enabledTools,
          samplingParams,
          projectId,
          systemPromptOverride,
          extraAnalyze: extraAnalyze || false,
        }),
        signal: controller.signal,
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
            if (event.error) {
              toast.error(event.error);
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: event.error, error: true, streaming: false } : m)
              );
              break;
            }
            if (event.type === 'analysis_start') {
              setAnalysisState({ status: 'streaming', thinking: '', content: '', data: null, error: null });
            } else if (event.type === 'analysis_thinking') {
              setAnalysisState(prev => ({ ...prev, thinking: prev.thinking + event.content }));
            } else if (event.type === 'analysis_content') {
              setAnalysisState(prev => ({ ...prev, content: prev.content + event.content }));
            } else if (event.type === 'analysis_result') {
              if (event.data?.failed) {
                setAnalysisState(prev => ({ ...prev, status: 'failed', error: event.data.error || 'Analysis failed' }));
              } else {
                setAnalysisState(prev => ({ ...prev, status: 'complete', data: event.data }));
              }
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
              // Safety net: if analysis is still stuck on 'streaming' when chat is done, mark failed
              setAnalysisState(prev => prev.status === 'streaming' ? { ...prev, status: 'failed', error: 'Analysis did not complete' } : prev);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.streaming ? { ...m, streaming: false } : m)
      );
      // Ensure analyzer isn't stuck if stream ended without done event
      setAnalysisState(prev => prev.status === 'streaming' ? { ...prev, status: 'failed', error: 'Stream ended unexpectedly' } : prev);
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled — mark current streaming message as done
        setMessages((prev) =>
          prev.map((m) => m.streaming ? { ...m, streaming: false, content: m.content || '(stopped)' } : m)
        );
        toast('Response stopped');
      } else {
        const detail = err.message || 'Unknown error';
        const backendHint = `Failed to get response: ${detail}. Check that your LLM backend (Ollama or llama-server) is running and reachable in Settings > Backend.`;
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: backendHint, error: true }]);
        toast.error(`LLM backend error: ${detail}`);
      }
      // Mark analysis as failed on error
      setAnalysisState(prev => prev.status === 'streaming' ? { ...prev, status: 'failed', error: 'Connection error' } : prev);
    } finally {
      clearStuckTimer();
      abortRef.current = null;
      setStreaming(false);
    }
  }, []); // conversationId accessed via ref to avoid stale closures

  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, newContent }),
      });
      if (res.ok && conversationIdRef.current) {
        await loadConversation(conversationIdRef.current);
        toast.success('Message updated');
      }
    } catch {
      toast.error('Failed to edit message');
    }
  }, [loadConversation]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (res.ok && conversationIdRef.current) {
        await loadConversation(conversationIdRef.current);
        toast.success('Message deleted');
      }
    } catch {
      toast.error('Failed to delete message');
    }
  }, [loadConversation]);

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
          // Reload conversation to get fresh messages, then find last user message
          const convRes = await fetch(`/api/conversations/${data.conversationId}`);
          if (convRes.ok) {
            const convData = await convRes.json();
            const freshMessages = convData.messages || [];
            setMessages(freshMessages);
            setConversationId(data.conversationId);
            const lastUser = freshMessages.filter((m) => m.role === 'user').pop();
            if (lastUser) {
              await sendMessage({ message: lastUser.content, reasoningLevel: data.reasoningLevel });
            }
          }
        }
      }
    } catch {
      toast.error('Failed to regenerate');
    }
  }, [sendMessage]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationMeta(null);
    setAnalysisState({ status: 'idle', thinking: '', content: '', data: null, error: null });
  }, []);

  return {
    messages, streaming, conversationId, conversationMeta, analysisState,
    sendMessage, stopStreaming, editMessage, deleteMessage, regenerate,
    loadConversation, clearChat, setConversationId,
  };
}
