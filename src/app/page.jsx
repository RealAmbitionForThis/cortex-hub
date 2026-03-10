'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/hooks/useChat';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');
  const chat = useChat();
  const [defaultModel, setDefaultModel] = useState('');

  useEffect(() => {
    if (conversationId) {
      chat.loadConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings?.main_model) setDefaultModel(d.settings.main_model);
    }).catch(() => {});
  }, []);

  return (
    <AppShell title="Chat" onNewChat={chat.clearChat}>
      <ChatWindow
        messages={chat.messages}
        streaming={chat.streaming}
        onSend={chat.sendMessage}
        onEdit={chat.editMessage}
        onDelete={chat.deleteMessage}
        onRegenerate={chat.regenerate}
        modelName={defaultModel}
        conversationId={chat.conversationId}
        conversationMeta={chat.conversationMeta}
        analysisState={chat.analysisState}
      />
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatPage />
    </Suspense>
  );
}
