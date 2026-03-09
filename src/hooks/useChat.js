'use client';

import { useState, useCallback, useRef } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const abortRef = useRef(null);

  const loadConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversationId(id);
      }
    } catch {
      // ignore
    }
  }, []);

  const sendMessage = useCallback(async ({ message, model, reasoningLevel }) => {
    setStreaming(true);

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: message, reasoning_level: reasoningLevel };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message, model, reasoningLevel }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantId = crypto.randomUUID();
      let buffer = '';

      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

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
            if (event.type === 'content') {
              assistantContent += event.content;
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
              assistantId = crypto.randomUUID();
              setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
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
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Failed to get response. Is Ollama running?', error: true }]);
    } finally {
      setStreaming(false);
    }
  }, [conversationId]);

  const editMessage = useCallback(async (messageId, newContent) => {
    const res = await fetch('/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, newContent }),
    });
    if (res.ok && conversationId) {
      await loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  const deleteMessage = useCallback(async (messageId) => {
    const res = await fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
    if (res.ok && conversationId) {
      await loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  const regenerate = useCallback(async (messageId, reasoningLevel) => {
    const res = await fetch('/api/chat/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, reasoningLevel }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.conversationId) {
        await loadConversation(data.conversationId);
        // Get last user message and resend
        const lastUser = messages.filter((m) => m.role === 'user').pop();
        if (lastUser) {
          await sendMessage({ message: lastUser.content, reasoningLevel: data.reasoningLevel });
        }
      }
    }
  }, [messages, loadConversation, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages, streaming, conversationId,
    sendMessage, editMessage, deleteMessage, regenerate,
    loadConversation, clearChat, setConversationId,
  };
}
