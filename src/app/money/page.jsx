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
import { SpendingChart } from '@/components/dashboards/SpendingChart';
import { BudgetProgress } from '@/components/dashboards/BudgetProgress';
import { BillsUpcoming } from '@/components/dashboards/BillsUpcoming';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatCard } from '@/components/shared/StatCard';
import { Plus, DollarSign, TrendingUp, TrendingDown, CreditCard, RefreshCw, Star, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { TRANSACTION_CATEGORIES, SUBSCRIPTION_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function MoneyPage() {
  const [balance, setBalance] = useState({ income: 0, expenses: 0, net: 0 });
  const [transactions, setTransactions] = useState([]);
  const [spending, setSpending] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subMonthlyTotal, setSubMonthlyTotal] = useState(0);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txForm, setTxForm] = useState({ amount: '', category: 'other', description: '', date: '' });
  const [billForm, setBillForm] = useState({ name: '', amount: '', frequency: 'monthly', due_day: '', category: '' });
  const [subForm, setSubForm] = useState({ name: '', amount: '', frequency: 'monthly', category: 'streaming', service_url: '', usage_rating: 3 });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([
      fetch('/api/money?view=balance').then(r => r.json()).then(setBalance).catch(() => {}),
      fetch('/api/money').then(r => r.json()).then(d => setTransactions(d.transactions || [])).catch(() => {}),
      fetch('/api/money?view=spending').then(r => r.json()).then(d => setSpending(d.spending || [])).catch(() => {}),
      fetch('/api/money?view=budgets').then(r => r.json()).then(d => setBudgets(d.budgets || [])).catch(() => {}),
      fetch('/api/bills').then(r => r.json()).then(d => setBills(d.bills || [])).catch(() => {}),
      fetch('/api/bills?view=subscriptions').then(r => r.json()).then(d => {
        setSubscriptions(d.subscriptions || []);
        setSubMonthlyTotal(d.monthly_total || 0);
      }).catch(() => {}),
    ]);
    setLoading(false);
  }

  async function handleAddTransaction() {
    await fetch('/api/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm, amount: parseFloat(txForm.amount) }),
    });
    setShowAddTx(false);
    setTxForm({ amount: '', category: 'other', description: '', date: '' });
    fetchAll();
  }

  async function handleAddBill() {
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...billForm, amount: parseFloat(billForm.amount), due_day: billForm.due_day ? parseInt(billForm.due_day) : undefined }),
    });
    setShowAddBill(false);
    setBillForm({ name: '', amount: '', frequency: 'monthly', due_day: '', category: '' });
    fetchAll();
  }

  async function handleAddSubscription() {
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_subscription', ...subForm, amount: parseFloat(subForm.amount) }),
    });
    setShowAddSub(false);
    setSubForm({ name: '', amount: '', frequency: 'monthly', category: 'streaming', service_url: '', usage_rating: 3 });
    fetchAll();
  }

  async function handleRateSubscription(id, usage_rating) {
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rate_subscription', id, usage_rating }),
    });
    fetchAll();
  }

  async function handleDeleteSubscription(id) {
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_subscription', id }),
    });
    fetchAll();
  }

  async function handleMarkPaid(billId) {
    await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_paid', bill_id: billId }) });
    fetchAll();
  }

  if (loading) return <AppShell title="Money"><LoadingSpinner /></AppShell>;

  const txColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(v)}</span> },
  ];

  return (
    <AppShell title="Money">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddTx(true)}><Plus className="h-4 w-4 mr-2" /> Transaction</Button>
          <Button variant="outline" onClick={() => setShowAddBill(true)}><Plus className="h-4 w-4 mr-2" /> Bill</Button>
          <Button variant="outline" onClick={() => setShowAddSub(true)}><RefreshCw className="h-4 w-4 mr-2" /> Subscription</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Net Balance" value={formatCurrency(balance.net)} icon={DollarSign} />
          <StatCard title="Income" value={formatCurrency(balance.income)} icon={TrendingUp} />
          <StatCard title="Expenses" value={formatCurrency(balance.expenses)} icon={TrendingDown} />
          <StatCard title="Subscriptions/mo" value={formatCurrency(subMonthlyTotal)} icon={RefreshCw} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart spending={spending} />
          <BudgetProgress budgets={budgets} spending={spending} />
        </div>

        <BillsUpcoming bills={bills} onMarkPaid={handleMarkPaid} />

        {/* Subscriptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subscriptions</CardTitle>
              <span className="text-sm text-muted-foreground">{formatCurrency(subMonthlyTotal)}/mo total</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions tracked yet</p>
            ) : subscriptions.map((sub) => (
              <div key={sub.id} className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                sub.usage_rating && sub.usage_rating <= 2 && 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sub.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{sub.frequency}</Badge>
                    {sub.service_url && (
                      <a href={sub.service_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{formatCurrency(sub.amount)}/{sub.frequency === 'yearly' ? 'yr' : sub.frequency === 'quarterly' ? 'qtr' : 'mo'}</span>
                    {sub.usage_rating && sub.usage_rating <= 2 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Consider cancelling
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRateSubscription(sub.id, r)}
                      className="p-0.5"
                    >
                      <Star className={cn(
                        'h-4 w-4',
                        r <= (sub.usage_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
          <CardContent><DataTable columns={txColumns} data={transactions} /></CardContent>
        </Card>

        {/* Add Transaction Dialog */}
        <Dialog open={showAddTx} onOpenChange={setShowAddTx}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Amount (negative for expense)</Label><Input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={txForm.category} onValueChange={(v) => setTxForm({ ...txForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddTransaction}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Bill Dialog */}
        <Dialog open={showAddBill} onOpenChange={setShowAddBill}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={billForm.name} onChange={(e) => setBillForm({ ...billForm, name: e.target.value })} /></div>
              <div><Label>Amount</Label><Input type="number" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} /></div>
              <div><Label>Frequency</Label>
                <Select value={billForm.frequency} onValueChange={(v) => setBillForm({ ...billForm, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="once">Once</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due Day (1-31)</Label><Input type="number" min="1" max="31" value={billForm.due_day} onChange={(e) => setBillForm({ ...billForm, due_day: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddBill}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Subscription</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="Netflix, Spotify, etc." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} /></div>
                <div><Label>Frequency</Label>
                  <Select value={subForm.frequency} onValueChange={(v) => setSubForm({ ...subForm, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Category</Label>
                <Select value={subForm.category} onValueChange={(v) => setSubForm({ ...subForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBSCRIPTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Service URL (optional)</Label><Input value={subForm.service_url} onChange={(e) => setSubForm({ ...subForm, service_url: e.target.value })} placeholder="https://..." /></div>
              <div>
                <Label>Usage Rating</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Button
                      key={r}
                      variant={subForm.usage_rating === r ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSubForm({ ...subForm, usage_rating: r })}
                    >
                      <Star className={cn('h-3 w-3', r <= subForm.usage_rating ? 'fill-current' : '')} />
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">How much do you actually use this?</p>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAddSubscription}>Add Subscription</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
