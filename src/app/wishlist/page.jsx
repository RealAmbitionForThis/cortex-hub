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
import { Plus, Gift, Target, PiggyBank, ExternalLink, Check, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { WISHLIST_CATEGORIES, WISHLIST_PRIORITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [pods, setPods] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [showContribute, setShowContribute] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', target_price: '', url: '', priority: 'medium', category: 'other', notes: '' });
  const [podForm, setPodForm] = useState({ name: '', target_amount: '', wishlist_item_id: '' });
  const [contributeForm, setContributeForm] = useState({ amount: '', note: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([
      fetch('/api/wishlist').then(r => r.json()).then(d => {
        setItems(d.items || []);
        setInsight(d.insight || null);
      }).catch(() => {}),
      fetch('/api/pods').then(r => r.json()).then(d => setPods(d.pods || [])).catch(() => {}),
    ]);
    setLoading(false);
  }

  async function handleAddItem() {
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemForm, target_price: parseFloat(itemForm.target_price) || undefined }),
    });
    setShowAddItem(false);
    setItemForm({ name: '', target_price: '', url: '', priority: 'medium', category: 'other', notes: '' });
    fetchAll();
  }

  async function handleMarkPurchased(id) {
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_purchased', id }),
    });
    fetchAll();
  }

  async function handleDeleteItem(id) {
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchAll();
  }

  async function handleCreatePod() {
    await fetch('/api/pods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...podForm, target_amount: parseFloat(podForm.target_amount) }),
    });
    setShowCreatePod(false);
    setPodForm({ name: '', target_amount: '', wishlist_item_id: '' });
    fetchAll();
  }

  async function handleContribute(podId) {
    await fetch('/api/pods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'contribute', pod_id: podId, amount: parseFloat(contributeForm.amount), note: contributeForm.note || undefined }),
    });
    setShowContribute(null);
    setContributeForm({ amount: '', note: '' });
    fetchAll();
  }

  async function handleDeletePod(id) {
    await fetch('/api/pods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchAll();
  }

  if (loading) return <AppShell title="Wishlist"><LoadingSpinner /></AppShell>;

  const unpurchased = items.filter(i => !i.purchased);
  const totalValue = unpurchased.reduce((s, i) => s + (i.target_price || 0), 0);
  const totalSaved = pods.reduce((s, p) => s + (p.current_amount || 0), 0);

  const priorityColor = { high: 'destructive', medium: 'default', low: 'secondary' };

  return (
    <AppShell title="Wishlist">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddItem(true)}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          <Button variant="outline" onClick={() => setShowCreatePod(true)}><PiggyBank className="h-4 w-4 mr-2" /> Create Pod</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Wishlist Value" value={formatCurrency(totalValue)} icon={Gift} />
          <StatCard title="Items" value={unpurchased.length} icon={Target} />
          <StatCard title="Active Pods" value={pods.length} icon={PiggyBank} />
          <StatCard title="Total Saved" value={formatCurrency(totalSaved)} icon={DollarSign} />
        </div>

        {/* Budget Insight */}
        {insight?.insight && (
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm">{insight.insight}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wishlist Items */}
          <Card>
            <CardHeader><CardTitle className="text-base">Wishlist</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {unpurchased.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items on your wishlist</p>
              ) : unpurchased.map((item) => {
                const linkedPod = pods.find(p => p.wishlist_item_id === item.id);
                return (
                  <div key={item.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge variant={priorityColor[item.priority] || 'default'} className="text-[10px]">{item.priority}</Badge>
                          {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                        </div>
                        {item.target_price > 0 && (
                          <span className="text-sm text-muted-foreground">{formatCurrency(item.target_price)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkPurchased(item.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {linkedPod && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{linkedPod.name}</span>
                          <span>{formatCurrency(linkedPod.current_amount)} / {formatCurrency(linkedPod.target_amount)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${linkedPod.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Savings Pods */}
          <Card>
            <CardHeader><CardTitle className="text-base">Savings Pods</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No savings pods yet</p>
              ) : pods.map((pod) => {
                const linkedItem = items.find(i => i.id === pod.wishlist_item_id);
                return (
                  <div key={pod.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{pod.name}</span>
                        {linkedItem && (
                          <span className="text-xs text-muted-foreground ml-2">for {linkedItem.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowContribute(pod.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePod(pod.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{formatCurrency(pod.current_amount)}</span>
                        <span className="text-muted-foreground">{formatCurrency(pod.target_amount)} ({pod.progress}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            pod.progress >= 100 ? 'bg-green-500' : 'bg-primary'
                          )}
                          style={{ width: `${pod.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Add Item Dialog */}
        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Wishlist Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="PS5 Pro, new headphones, etc." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Target Price</Label><Input type="number" value={itemForm.target_price} onChange={(e) => setItemForm({ ...itemForm, target_price: e.target.value })} /></div>
                <div><Label>Priority</Label>
                  <Select value={itemForm.priority} onValueChange={(v) => setItemForm({ ...itemForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WISHLIST_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Category</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WISHLIST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>URL (optional)</Label><Input value={itemForm.url} onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Notes</Label><Input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddItem}>Add Item</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Pod Dialog */}
        <Dialog open={showCreatePod} onOpenChange={setShowCreatePod}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Savings Pod</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={podForm.name} onChange={(e) => setPodForm({ ...podForm, name: e.target.value })} placeholder="PS5 Fund, Vacation, etc." /></div>
              <div><Label>Target Amount</Label><Input type="number" value={podForm.target_amount} onChange={(e) => setPodForm({ ...podForm, target_amount: e.target.value })} /></div>
              <div><Label>Link to Wishlist Item (optional)</Label>
                <Select value={podForm.wishlist_item_id} onValueChange={(v) => setPodForm({ ...podForm, wishlist_item_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {unpurchased.map(i => <SelectItem key={i.id} value={i.id}>{i.name}{i.target_price ? ` (${formatCurrency(i.target_price)})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreatePod}>Create Pod</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contribute Dialog */}
        <Dialog open={!!showContribute} onOpenChange={() => setShowContribute(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Pod</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Amount</Label><Input type="number" value={contributeForm.amount} onChange={(e) => setContributeForm({ ...contributeForm, amount: e.target.value })} /></div>
              <div><Label>Note (optional)</Label><Input value={contributeForm.note} onChange={(e) => setContributeForm({ ...contributeForm, note: e.target.value })} placeholder="Payday savings, etc." /></div>
            </div>
            <DialogFooter><Button onClick={() => handleContribute(showContribute)}>Contribute</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
