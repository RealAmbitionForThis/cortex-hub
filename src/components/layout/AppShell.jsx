'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children, title, onNewChat: externalNewChat }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // API may not exist yet
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleNewChat() {
    setActiveConversationId(null);
    if (externalNewChat) externalNewChat();
    // If already on home page, force refresh by adding timestamp
    if (pathname === '/') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  }

  function handleSelectConversation(id) {
    setActiveConversationId(id);
    router.push(`/?c=${id}`);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
