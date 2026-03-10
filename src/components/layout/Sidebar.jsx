'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain, Plus, DollarSign, Heart, Car, Users, CheckSquare,
  FileText, Database, Download, Paintbrush, FolderOpen,
  ChevronDown, ChevronRight, Settings, Pin, MessageSquare, Gift,
  Package, CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/utils/date';
import { truncate } from '@/lib/utils/format';

const NAV_GROUPS = [
  {
    label: 'Life',
    items: [
      { href: '/money', icon: DollarSign, label: 'Money' },
      { href: '/wishlist', icon: Gift, label: 'Wishlist' },
      { href: '/inventory', icon: Package, label: 'Inventory' },
      { href: '/health', icon: Heart, label: 'Health' },
      { href: '/vehicle', icon: Car, label: 'Vehicle' },
      { href: '/important-dates', icon: CalendarClock, label: 'Dates' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { href: '/projects', icon: FolderOpen, label: 'Projects' },
      { href: '/contacts', icon: Users, label: 'Contacts' },
      { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { href: '/documents', icon: FileText, label: 'Documents' },
    ],
  },
  {
    label: 'AI & Creative',
    items: [
      { href: '/comfyui', icon: Paintbrush, label: 'ComfyUI' },
      { href: '/memories', icon: Database, label: 'Memories' },
      { href: '/exports', icon: Download, label: 'Exports' },
    ],
  },
];

export function Sidebar({ open, onOpenChange, conversations = [], onNewChat, onSelectConversation, activeConversationId }) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full">
      <SidebarHeader onNewChat={onNewChat} onClose={() => onOpenChange?.(false)} />
      <ScrollArea className="flex-1">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => { onSelectConversation(id); onOpenChange?.(false); }}
        />
      </ScrollArea>
      <Separator />
      <ScrollArea className="max-h-[40vh]">
        <NavGroups pathname={pathname} onNavigate={() => onOpenChange?.(false)} />
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Link
          href="/settings"
          onClick={() => onOpenChange?.(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
            pathname === '/settings' && 'bg-accent font-medium'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 border-r bg-card h-screen">
        {content}
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarHeader({ onNewChat, onClose }) {
  return (
    <div className="h-14 px-4 flex items-center justify-between border-b shrink-0">
      <Link href="/" onClick={onClose} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Brain className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">Cortex</span>
      </Link>
      <Button size="icon" variant="ghost" onClick={() => { onNewChat(); onClose?.(); }}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ConversationList({ conversations, activeId, onSelect }) {
  if (!conversations.length) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
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

function NavGroups({ pathname, onNavigate }) {
  return (
    <nav className="p-2 space-y-1">
      {NAV_GROUPS.map((group) => (
        <NavGroup key={group.label} group={group} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavGroup({ group, pathname, onNavigate }) {
  const isActive = group.items.some(item => pathname === item.href);
  const [open, setOpen] = useState(isActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
        <span>{group.label}</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 ml-1">
          {group.items.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent',
                pathname === href && 'bg-accent font-medium'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
