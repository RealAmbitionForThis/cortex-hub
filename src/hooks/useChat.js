'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationMeta, setConversationMeta] = useState(null);
  const abortRef = useRef(null);

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

  const sendMessage = useCallback(async ({ message, model, reasoningLevel, enabledTools, attachments, temperature, contextWindow, projectId, systemPromptOverride }) => {
    setStreaming(true);

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
          enabledTools,
          temperature,
          contextWindow,
          projectId,
          systemPromptOverride,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let thinkingContent = '';
      let assistantId = crypto.randomUUID();
      let buffer = '';

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
            if (event.type === 'thinking') {
              thinkingContent += event.content;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, thinking: thinkingContent } : m)
              );
            } else if (event.type === 'content') {
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
              thinkingContent = '';
              assistantId = crypto.randomUUID();
              setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', thinking: '', streaming: true }]);
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false, tokenStats: event.tokenStats || null } : m)
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
      toast.error('Failed to get response');
    } finally {
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
  }, []);

  return {
    messages, streaming, conversationId, conversationMeta,
    sendMessage, editMessage, deleteMessage, regenerate,
    loadConversation, clearChat, setConversationId,
  };
}
