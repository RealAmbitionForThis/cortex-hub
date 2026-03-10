'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatCard } from '@/components/shared/StatCard';
import { Plus, CalendarClock, AlertTriangle, Clock, Target, Trash2, Bell, BellOff } from 'lucide-react';
import { IMPORTANT_DATE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ImportantDatesPage() {
  const [dates, setDates] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming_30: 0, overdue: 0, next: null });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState('upcoming'); // upcoming | all | timeline
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState({
    title: '', date: '', type: 'other', description: '', recurring: '',
    reminder_days_before: '7', notify: true,
  });

  useEffect(() => { fetchAll(); }, [view]);

  async function fetchAll() {
    setLoading(true);
    try {
      let url = '/api/important-dates';
      if (view === 'upcoming') url += '?upcoming_days=365';
      else if (view === 'timeline') url += '?view=timeline';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setDates(d.dates || d.events || []);
        if (d.stats) setStats(d.stats);
      }
    } catch {}
    setLoading(false);
  }

  async function handleAdd() {
    await fetch('/api/important-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        reminder_days_before: parseInt(form.reminder_days_before) || 7,
        recurring: form.recurring || undefined,
      }),
    });
    setShowAdd(false);
    setForm({ title: '', date: '', type: 'other', description: '', recurring: '', reminder_days_before: '7', notify: true });
    fetchAll();
  }

  async function handleDelete(id) {
    await fetch('/api/important-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchAll();
  }

  async function handleToggleNotify(id, currentNotify) {
    await fetch('/api/important-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, notify: !currentNotify }),
    });
    fetchAll();
  }

  if (loading) return <AppShell title="Important Dates"><LoadingSpinner /></AppShell>;

  const filtered = filterType === 'all' ? dates : dates.filter(d => d.type === filterType);

  function daysUntil(dateStr) {
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  }

  function urgencyColor(days) {
    if (days < 0) return 'text-red-600 dark:text-red-400';
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 30) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  }

  const typeLabels = {
    passport_expiry: 'Passport',
    license_expiry: 'License',
    lease_renewal: 'Lease',
    car_registration: 'Car Reg',
    insurance_renewal: 'Insurance',
    visa_expiry: 'Visa',
    subscription_renewal: 'Subscription',
    anniversary: 'Anniversary',
    birthday: 'Birthday',
    appointment: 'Appointment',
    deadline: 'Deadline',
    milestone: 'Milestone',
    other: 'Other',
  };

  // Group dates by month for timeline view
  const groupedByMonth = {};
  if (view === 'timeline') {
    for (const d of filtered) {
      const month = d.date.substring(0, 7); // YYYY-MM
      if (!groupedByMonth[month]) groupedByMonth[month] = [];
      groupedByMonth[month].push(d);
    }
  }

  return (
    <AppShell title="Important Dates">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Date</Button>
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            {['upcoming', 'all', 'timeline'].map(v => (
              <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm" className="text-xs capitalize" onClick={() => setView(v)}>
                {v}
              </Button>
            ))}
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {IMPORTANT_DATE_TYPES.map(t => <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Dates" value={stats.total} icon={CalendarClock} />
          <StatCard title="Next 30 Days" value={stats.upcoming_30} icon={Clock} />
          <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} />
          <StatCard
            title="Next Up"
            value={stats.next ? stats.next.title : '—'}
            icon={Target}
          />
        </div>

        {/* Timeline View */}
        {view === 'timeline' ? (
          <div className="space-y-6">
            {Object.keys(groupedByMonth).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No events to show</CardContent></Card>
            ) : Object.entries(groupedByMonth).map(([month, events]) => (
              <div key={month}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h3>
                <div className="space-y-1 border-l-2 border-muted pl-4 ml-2">
                  {events.map(d => {
                    const days = daysUntil(d.date);
                    return (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">{d.date.substring(5)}</span>
                          <span className="text-sm font-medium">{d.title}</span>
                          <Badge variant="outline" className="text-[10px]">{typeLabels[d.type] || d.type}</Badge>
                          {d.recurring && <Badge variant="secondary" className="text-[10px]">{d.recurring}</Badge>}
                        </div>
                        <span className={cn('text-xs', urgencyColor(days))}>
                          {days === 0 ? 'Today' : days > 0 ? `${days}d` : `${Math.abs(days)}d ago`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No dates found</CardContent></Card>
            ) : filtered.map(d => {
              const days = daysUntil(d.date);
              return (
                <Card key={d.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{d.title}</span>
                        <Badge variant="outline" className="text-[10px]">{typeLabels[d.type] || d.type}</Badge>
                        {d.recurring && <Badge variant="secondary" className="text-[10px]">{d.recurring}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className={urgencyColor(days)}>
                          {d.date} — {days === 0 ? 'Today!' : days > 0 ? `${days} day${days !== 1 ? 's' : ''} away` : `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`}
                        </span>
                        {d.description && <span>· {d.description}</span>}
                        {d.reminder_days_before > 0 && <span>· Reminder {d.reminder_days_before}d before</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleNotify(d.id, d.notify)}>
                        {d.notify ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Date Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Important Date</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Passport renewal, lease end date, etc." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{IMPORTANT_DATE_TYPES.map(t => <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description (optional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Recurring</Label>
                  <Select value={form.recurring || 'none'} onValueChange={(v) => setForm({ ...form, recurring: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">One-time</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Remind before (days)</Label><Input type="number" value={form.reminder_days_before} onChange={(e) => setForm({ ...form, reminder_days_before: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Add Date</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
