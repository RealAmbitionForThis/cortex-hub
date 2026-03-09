'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ContactsList } from '@/components/dashboards/ContactsList';
import { UpcomingFollowups } from '@/components/dashboards/UpcomingFollowups';
import { Users, Plus, Search } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', role: '', notes: '' });
  const [intForm, setIntForm] = useState({ type: 'note', notes: '', date: '' });

  useEffect(() => { fetchContacts(); fetchFollowups(); }, []);

  async function fetchContacts() {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/contacts${params}`);
    if (res.ok) { const d = await res.json(); setContacts(d.contacts || []); }
    setLoading(false);
  }

  async function fetchFollowups() {
    const res = await fetch('/api/contacts?view=followups');
    if (res.ok) { const d = await res.json(); setFollowups(d.followups || []); }
  }

  async function selectContact(id) {
    setSelected(id);
    const res = await fetch(`/api/contacts?id=${id}`);
    if (res.ok) { const d = await res.json(); setInteractions(d.interactions || []); }
  }

  async function handleAdd() {
    await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', company: '', role: '', notes: '' });
    fetchContacts();
  }

  async function handleAddInteraction() {
    await fetch('/api/contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'interaction', contact_id: selected, ...intForm, date: intForm.date || new Date().toISOString().split('T')[0] }),
    });
    setShowInteraction(false);
    setIntForm({ type: 'note', notes: '', date: '' });
    selectContact(selected);
    if (intForm.type === 'followup') fetchFollowups();
  }

  async function handleDelete(id) {
    await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
    if (selected === id) { setSelected(null); setInteractions([]); }
    fetchContacts();
  }

  useEffect(() => { const t = setTimeout(fetchContacts, 300); return () => clearTimeout(t); }, [search]);

  const contact = contacts.find(c => c.id === selected);

  if (loading && contacts.length === 0) return <AppShell title="Contacts"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Contacts">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add</Button>
        </div>

        {followups.length > 0 && <UpcomingFollowups followups={followups} onSelect={selectContact} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {contacts.length === 0 ? (
              <EmptyState icon={Users} title="No contacts" description="Add a contact to get started" />
            ) : (
              <ContactsList contacts={contacts} selected={selected} onSelect={selectContact} onDelete={handleDelete} />
            )}
          </div>
          <div className="lg:col-span-2">
            {contact ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{contact.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{[contact.role, contact.company].filter(Boolean).join(' at ')}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowInteraction(true)}>Log Interaction</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {contact.email && <div><span className="text-muted-foreground">Email:</span> {contact.email}</div>}
                    {contact.phone && <div><span className="text-muted-foreground">Phone:</span> {contact.phone}</div>}
                    {contact.birthday && <div><span className="text-muted-foreground">Birthday:</span> {contact.birthday}</div>}
                  </div>
                  {contact.notes && <p className="text-sm">{contact.notes}</p>}
                  {contact.tags?.length > 0 && <div className="flex gap-1 flex-wrap">{contact.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Interactions</h4>
                    {interactions.length === 0 ? <p className="text-sm text-muted-foreground">No interactions yet</p> : interactions.map(i => (
                      <div key={i.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                        <div><Badge variant="outline" className="mr-2">{i.type}</Badge>{i.notes}</div>
                        <span className="text-muted-foreground">{i.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Select a contact to view details</CardContent></Card>
            )}
          </div>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent><DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company</Label><Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
                <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Add Contact</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showInteraction} onOpenChange={setShowInteraction}>
          <DialogContent><DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Type</Label>
                <Select value={intForm.type} onValueChange={v => setIntForm({...intForm, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={intForm.notes} onChange={e => setIntForm({...intForm, notes: e.target.value})} /></div>
              <div><Label>Date</Label><Input type="date" value={intForm.date} onChange={e => setIntForm({...intForm, date: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddInteraction}>Log</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
