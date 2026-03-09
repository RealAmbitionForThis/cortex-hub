'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemories } from '@/hooks/useMemories';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { DailyLogCalendar } from '@/components/dashboards/DailyLogCalendar';
import { Database, Lock, Trash2, Plus, Search } from 'lucide-react';
import { formatRelative } from '@/lib/utils/date';

export default function MemoriesPage() {
  return (
    <AppShell title="Memories">
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="persistent">
          <TabsList>
            <TabsTrigger value="persistent">Persistent</TabsTrigger>
            <TabsTrigger value="static">Static</TabsTrigger>
            <TabsTrigger value="daily">Daily Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="persistent"><MemoryList type="persistent" /></TabsContent>
          <TabsContent value="static"><MemoryList type="static" /></TabsContent>
          <TabsContent value="daily"><DailyLogCalendar /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function MemoryList({ type }) {
  const { memories, loading, addMemory, deleteMemory } = useMemories(type);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ content: '', category: 'fact', module: 'general' });

  const filtered = search
    ? memories.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()))
    : memories;

  async function handleAdd() {
    await addMemory({ ...form, memory_type: type, protected: type === 'static' });
    setShowAdd(false);
    setForm({ content: '', category: 'fact', module: 'general' });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search memories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Database} title="No memories" description={`No ${type} memories found`} />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 border rounded-lg">
              {m.protected ? <Lock className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /> : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm">{m.content}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{m.category}</Badge>
                  <Badge variant="outline">{m.module}</Badge>
                  <span className="text-xs text-muted-foreground">{formatRelative(m.created_at)}</span>
                </div>
              </div>
              {!m.protected && (
                <Button variant="ghost" size="icon" onClick={() => deleteMemory(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {type} Memory</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Add Memory</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
