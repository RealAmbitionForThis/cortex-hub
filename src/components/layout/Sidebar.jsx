'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain, Plus, DollarSign, Heart, Car, Users, CheckSquare,
  FileText, Database, Settings, MessageSquare, Pin, Download, Paintbrush,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/utils/date';
import { truncate } from '@/lib/utils/format';
import { SystemDashboard } from '@/components/shared/SystemDashboard';

const NAV_ITEMS = [
  { href: '/money', icon: DollarSign, label: 'Money' },
  { href: '/health', icon: Heart, label: 'Health' },
  { href: '/vehicle', icon: Car, label: 'Vehicle' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/comfyui', icon: Paintbrush, label: 'ComfyUI' },
  { href: '/exports', icon: Download, label: 'Exports' },
  { href: '/memories', icon: Database, label: 'Memories' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ conversations = [], onNewChat, onSelectConversation, activeConversationId }) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 border-r bg-card h-screen">
      <SidebarHeader onNewChat={onNewChat} />
      <Separator />
      <ScrollArea className="flex-1">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={onSelectConversation}
        />
      </ScrollArea>
      <Separator />
      <NavLinks pathname={pathname} />
      <Separator />
      <SystemStatusSection />
    </div>
  );
}

function SidebarHeader({ onNewChat }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Brain className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">Cortex</span>
      </Link>
      <Button size="icon" variant="ghost" onClick={onNewChat}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ConversationList({ conversations, activeId, onSelect }) {
  if (!conversations.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">No conversations yet</p>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
            activeId === conv.id && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-1">
            {conv.pinned ? <Pin className="h-3 w-3 shrink-0" /> : null}
            <span className="truncate font-medium">
              {truncate(conv.title || 'New Chat', 30)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelative(conv.updated_at)}
          </span>
        </button>
      ))}
    </div>
  );
}

function SystemStatusSection() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
        <span className="font-medium">System Status</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SystemDashboard compact={true} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavLinks({ pathname }) {
  return (
    <nav className="p-2 space-y-1">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
            pathname === href && 'bg-accent font-medium'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
