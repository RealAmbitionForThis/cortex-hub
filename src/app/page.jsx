'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/hooks/useChat';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');
  const chat = useChat();

  useEffect(() => {
    if (conversationId) {
      chat.loadConversation(conversationId);
    }
  }, [conversationId]);

  return (
    <AppShell title="Chat">
      <ChatWindow
        messages={chat.messages}
        streaming={chat.streaming}
        onSend={chat.sendMessage}
        onEdit={chat.editMessage}
        onDelete={chat.deleteMessage}
        onRegenerate={chat.regenerate}
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
