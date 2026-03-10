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
import { Plus, Package, Shield, AlertTriangle, DollarSign, Search, Trash2, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { daysUntil } from '@/lib/utils/date';
import { INVENTORY_CATEGORIES, WARRANTY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, total_value: 0, expiring_soon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showClaim, setShowClaim] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({
    name: '', manufacturer: '', model: '', serial_number: '', purchase_date: '',
    purchase_price: '', warranty_expiry: '', warranty_type: 'standard',
    warranty_provider: '', coverage_details: '', category: 'electronics', location: '', notes: '',
  });
  const [claimForm, setClaimForm] = useState({ description: '', cost: '' });
  const [detailData, setDetailData] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
        setStats(d.stats || stats);
      }
    } catch {}
    setLoading(false);
  }

  async function handleAdd() {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        purchase_price: parseFloat(form.purchase_price) || undefined,
      }),
    });
    setShowAdd(false);
    setForm({ name: '', manufacturer: '', model: '', serial_number: '', purchase_date: '', purchase_price: '', warranty_expiry: '', warranty_type: 'standard', warranty_provider: '', coverage_details: '', category: 'electronics', location: '', notes: '' });
    fetchAll();
  }

  async function handleDelete(id) {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchAll();
  }

  async function loadDetail(id) {
    const res = await fetch(`/api/inventory?id=${id}`);
    if (res.ok) {
      const d = await res.json();
      setDetailData(d);
      setShowDetail(id);
    }
  }

  async function handleAddClaim(itemId) {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_claim',
        inventory_item_id: itemId,
        description: claimForm.description,
        cost: parseFloat(claimForm.cost) || 0,
      }),
    });
    setShowClaim(null);
    setClaimForm({ description: '', cost: '' });
    loadDetail(itemId);
  }

  if (loading) return <AppShell title="Inventory"><LoadingSpinner /></AppShell>;

  const filtered = items.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (searchTerm && !i.name.toLowerCase().includes(searchTerm.toLowerCase()) && !(i.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  function warrantyStatus(item) {
    if (!item.warranty_expiry) return null;
    const days = daysUntil(item.warranty_expiry);
    if (days < 0) return { label: 'Expired', variant: 'destructive', days };
    if (days <= 30) return { label: `${days}d left`, variant: 'destructive', days };
    if (days <= 90) return { label: `${days}d left`, variant: 'default', days };
    return { label: `${days}d left`, variant: 'secondary', days };
  }

  return (
    <AppShell title="Inventory">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {INVENTORY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Items" value={stats.total_items} icon={Package} />
          <StatCard title="Total Value" value={formatCurrency(stats.total_value)} icon={DollarSign} />
          <StatCard title="Expiring Soon" value={stats.expiring_soon} icon={AlertTriangle} />
          <StatCard title="Active Warranties" value={stats.total_items - stats.expired} icon={Shield} />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No items found</CardContent></Card>
          ) : filtered.map((item) => {
            const ws = warrantyStatus(item);
            return (
              <Card key={item.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => loadDetail(item.id)}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      {ws && <Badge variant={ws.variant} className="text-[10px]">{ws.label}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {item.manufacturer && <span>{item.manufacturer}{item.model ? ` ${item.model}` : ''}</span>}
                      {item.purchase_date && <span>Purchased {item.purchase_date}</span>}
                      {item.purchase_price > 0 && <span>{formatCurrency(item.purchase_price)}</span>}
                      {item.location && <span>@ {item.location}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Item Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Item Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="MacBook Pro, Samsung TV, etc." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Serial Number</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INVENTORY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
                <div><Label>Purchase Price</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Warranty Expiry</Label><Input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></div>
                <div><Label>Warranty Type</Label>
                  <Select value={form.warranty_type} onValueChange={(v) => setForm({ ...form, warranty_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WARRANTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Warranty Provider</Label><Input value={form.warranty_provider} onChange={(e) => setForm({ ...form, warranty_provider: e.target.value })} placeholder="Apple, Best Buy, etc." /></div>
              <div><Label>Coverage Details</Label><Input value={form.coverage_details} onChange={(e) => setForm({ ...form, coverage_details: e.target.value })} placeholder="Accidental damage, screen replacement, etc." /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Home office, bedroom, etc." /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Add Item</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            {detailData?.item && (
              <>
                <DialogHeader><DialogTitle>{detailData.item.name}</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                  {detailData.item.manufacturer && <div><span className="text-muted-foreground">Manufacturer:</span> {detailData.item.manufacturer} {detailData.item.model}</div>}
                  {detailData.item.serial_number && <div><span className="text-muted-foreground">Serial:</span> {detailData.item.serial_number}</div>}
                  {detailData.item.purchase_date && <div><span className="text-muted-foreground">Purchased:</span> {detailData.item.purchase_date}</div>}
                  {detailData.item.purchase_price > 0 && <div><span className="text-muted-foreground">Price:</span> {formatCurrency(detailData.item.purchase_price)}</div>}
                  {detailData.item.warranty_expiry && (
                    <div><span className="text-muted-foreground">Warranty:</span> {detailData.item.warranty_type} — expires {detailData.item.warranty_expiry}
                      {detailData.item.warranty_provider && ` (${detailData.item.warranty_provider})`}
                    </div>
                  )}
                  {detailData.item.coverage_details && <div><span className="text-muted-foreground">Coverage:</span> {detailData.item.coverage_details}</div>}
                  {detailData.item.location && <div><span className="text-muted-foreground">Location:</span> {detailData.item.location}</div>}
                  {detailData.item.notes && <div><span className="text-muted-foreground">Notes:</span> {detailData.item.notes}</div>}

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Warranty Claims</span>
                      <Button size="sm" variant="outline" onClick={() => setShowClaim(detailData.item.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Claim
                      </Button>
                    </div>
                    {(!detailData.claims || detailData.claims.length === 0) ? (
                      <p className="text-xs text-muted-foreground">No claims filed</p>
                    ) : detailData.claims.map((c) => (
                      <div key={c.id} className="p-2 bg-muted/50 rounded text-xs mb-1">
                        <div className="flex justify-between">
                          <span>{c.description}</span>
                          <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                        </div>
                        {c.resolution && <div className="text-muted-foreground mt-1">Resolution: {c.resolution}</div>}
                        <div className="text-muted-foreground">{c.claim_date}{c.cost > 0 ? ` — ${formatCurrency(c.cost)}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Claim Dialog */}
        <Dialog open={!!showClaim} onOpenChange={() => setShowClaim(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>File Warranty Claim</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Description</Label><Input value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} placeholder="Screen cracked, battery swelling, etc." /></div>
              <div><Label>Cost (if any)</Label><Input type="number" value={claimForm.cost} onChange={(e) => setClaimForm({ ...claimForm, cost: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleAddClaim(showClaim)}>File Claim</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
