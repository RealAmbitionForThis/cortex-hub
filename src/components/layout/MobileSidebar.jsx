'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain, Plus, DollarSign, Heart, Car, Users, CheckSquare,
  FileText, Database, Settings, Pin, Download,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { truncate } from '@/lib/utils/format';
import { formatRelative } from '@/lib/utils/date';

const NAV_ITEMS = [
  { href: '/money', icon: DollarSign, label: 'Money' },
  { href: '/health', icon: Heart, label: 'Health' },
  { href: '/vehicle', icon: Car, label: 'Vehicle' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/exports', icon: Download, label: 'Exports' },
  { href: '/memories', icon: Database, label: 'Memories' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileSidebar({ open, onOpenChange, conversations = [], onNewChat, onSelectConversation, activeConversationId }) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Cortex
          </SheetTitle>
        </SheetHeader>
        <div className="px-2">
          <Button size="sm" className="w-full" onClick={() => { onNewChat(); onOpenChange(false); }}>
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </Button>
        </div>
        <Separator className="my-2" />
        <ScrollArea className="flex-1 h-[40vh]">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => { onSelectConversation(conv.id); onOpenChange(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent',
                  activeConversationId === conv.id && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-1">
                  {conv.pinned ? <Pin className="h-3 w-3" /> : null}
                  <span className="truncate">{truncate(conv.title || 'New Chat', 25)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatRelative(conv.updated_at)}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-2" />
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent',
                pathname === href && 'bg-accent font-medium'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
