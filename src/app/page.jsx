'use client';

import { AppShell } from '@/components/layout/AppShell';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function HomePage() {
  return (
    <AppShell title="Chat">
      <EmptyState
        icon={MessageSquare}
        title="Start a conversation"
        description="Type a message to begin chatting with Cortex"
      />
    </AppShell>
  );
}
