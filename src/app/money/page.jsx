'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import { Plus, DollarSign, TrendingUp, TrendingDown, CreditCard, RefreshCw, Star, AlertTriangle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
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
  const [payroll, setPayroll] = useState([]);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddPayroll, setShowAddPayroll] = useState(false);
  const [showEditTx, setShowEditTx] = useState(false);
  const [showDeleteTx, setShowDeleteTx] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false);
  const [showDeleteBill, setShowDeleteBill] = useState(false);
  const [showEditSub, setShowEditSub] = useState(false);
  const [showDeleteSub, setShowDeleteSub] = useState(false);
  const [showDeletePayroll, setShowDeletePayroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txForm, setTxForm] = useState({ amount: '', category: 'other', description: '', date: '' });
  const [billForm, setBillForm] = useState({ name: '', amount: '', frequency: 'monthly', due_day: '', category: '' });
  const [subForm, setSubForm] = useState({ name: '', amount: '', frequency: 'monthly', category: 'streaming', service_url: '', usage_rating: 3 });
  const [payrollForm, setPayrollForm] = useState({ name: '', amount: '', frequency: 'biweekly' });
  const [editTxForm, setEditTxForm] = useState({ id: '', amount: '', category: '', description: '', date: '' });
  const [editBillForm, setEditBillForm] = useState({ id: '', name: '', amount: '', frequency: '', due_day: '', category: '' });
  const [editSubForm, setEditSubForm] = useState({ id: '', name: '', amount: '', frequency: '', category: '', service_url: '', usage_rating: 3 });
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      fetch('/api/money', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_payroll' }) })
        .then(r => r.json()).then(d => setPayroll(d.payroll || [])).catch(() => {}),
    ]);
    setLoading(false);
  }

  // --- Add handlers ---

  async function handleAddTransaction() {
    await fetch('/api/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm, amount: parseFloat(txForm.amount) }),
    });
    setShowAddTx(false);
    setTxForm({ amount: '', category: 'other', description: '', date: '' });
    toast.success('Transaction added');
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
    toast.success('Bill added');
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
    toast.success('Subscription added');
    fetchAll();
  }

  async function handleAddPayroll() {
    await fetch('/api/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_payroll', name: payrollForm.name, amount: parseFloat(payrollForm.amount), frequency: payrollForm.frequency }),
    });
    setShowAddPayroll(false);
    setPayrollForm({ name: '', amount: '', frequency: 'biweekly' });
    toast.success('Payroll added');
    fetchAll();
  }

  // --- Edit handlers ---

  async function handleEditTransaction() {
    await fetch('/api/money', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTxForm.id, amount: parseFloat(editTxForm.amount), category: editTxForm.category, description: editTxForm.description, date: editTxForm.date }),
    });
    setShowEditTx(false);
    toast.success('Transaction updated');
    fetchAll();
  }

  async function handleEditBill() {
    await fetch('/api/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editBillForm.id, name: editBillForm.name, amount: parseFloat(editBillForm.amount), frequency: editBillForm.frequency, due_day: editBillForm.due_day ? parseInt(editBillForm.due_day) : undefined, category: editBillForm.category }),
    });
    setShowEditBill(false);
    toast.success('Bill updated');
    fetchAll();
  }

  async function handleEditSubscription() {
    await fetch('/api/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editSubForm.id, name: editSubForm.name, amount: parseFloat(editSubForm.amount), frequency: editSubForm.frequency, category: editSubForm.category }),
    });
    setShowEditSub(false);
    toast.success('Subscription updated');
    fetchAll();
  }

  // --- Delete handlers ---

  async function handleDeleteTransaction() {
    await fetch(`/api/money?id=${deleteTarget.id}`, { method: 'DELETE' });
    setShowDeleteTx(false);
    setDeleteTarget(null);
    toast.success('Transaction deleted');
    fetchAll();
  }

  async function handleDeleteBill() {
    await fetch(`/api/bills?id=${deleteTarget.id}`, { method: 'DELETE' });
    setShowDeleteBill(false);
    setDeleteTarget(null);
    toast.success('Bill deleted');
    fetchAll();
  }

  async function handleDeleteSubscription(id) {
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_subscription', id }),
    });
    setShowDeleteSub(false);
    setDeleteTarget(null);
    toast.success('Subscription deleted');
    fetchAll();
  }

  async function handleDeletePayrollEntry() {
    await fetch('/api/money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_payroll', id: deleteTarget.id }),
    });
    setShowDeletePayroll(false);
    setDeleteTarget(null);
    toast.success('Payroll entry deleted');
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

  async function handleMarkPaid(billId) {
    await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_paid', bill_id: billId }) });
    toast.success('Bill marked as paid');
    fetchAll();
  }

  // --- Open edit/delete modals ---

  function openEditTx(tx) {
    setEditTxForm({ id: tx.id, amount: String(tx.amount), category: tx.category || 'other', description: tx.description || '', date: tx.date || '' });
    setShowEditTx(true);
  }

  function openDeleteTx(tx) {
    setDeleteTarget(tx);
    setShowDeleteTx(true);
  }

  function openEditBill(bill) {
    setEditBillForm({ id: bill.id, name: bill.name || '', amount: String(bill.amount), frequency: bill.frequency || 'monthly', due_day: bill.due_day ? String(bill.due_day) : '', category: bill.category || '' });
    setShowEditBill(true);
  }

  function openDeleteBill(bill) {
    setDeleteTarget(bill);
    setShowDeleteBill(true);
  }

  function openEditSub(sub) {
    setEditSubForm({ id: sub.id, name: sub.name || '', amount: String(sub.amount), frequency: sub.frequency || 'monthly', category: sub.category || 'streaming', service_url: sub.service_url || '', usage_rating: sub.usage_rating || 3 });
    setShowEditSub(true);
  }

  function openDeleteSub(sub) {
    setDeleteTarget(sub);
    setShowDeleteSub(true);
  }

  function openDeletePayroll(entry) {
    setDeleteTarget(entry);
    setShowDeletePayroll(true);
  }

  // --- Helper to parse payroll description ---
  function parsePayrollInfo(entry) {
    const match = entry.description?.match(/^Payroll:\s*(.+?)\s*\((\w+)\)$/);
    if (match) return { name: match[1], frequency: match[2] };
    return { name: entry.description || 'Unknown', frequency: 'unknown' };
  }

  if (loading) return <AppShell title="Money"><LoadingSpinner /></AppShell>;

  const txColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(v)}</span> },
    { key: 'actions', label: '', render: (_v, row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditTx(row); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteTx(row); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ];

  return (
    <AppShell title="Money">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddTx(true)}><Plus className="h-4 w-4 mr-2" /> Transaction</Button>
          <Button variant="outline" onClick={() => setShowAddBill(true)}><Plus className="h-4 w-4 mr-2" /> Bill</Button>
          <Button variant="outline" onClick={() => setShowAddSub(true)}><RefreshCw className="h-4 w-4 mr-2" /> Subscription</Button>
          <Button variant="outline" onClick={() => setShowAddPayroll(true)}><DollarSign className="h-4 w-4 mr-2" /> Add Payroll</Button>
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

        <BillsUpcoming bills={bills} onMarkPaid={handleMarkPaid} onEditBill={openEditBill} onDeleteBill={openDeleteBill} />

        {/* Payroll */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payroll</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddPayroll(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Payroll
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {payroll.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payroll entries yet</p>
            ) : payroll.map((entry) => {
              const info = parsePayrollInfo(entry);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{info.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{info.frequency}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatCurrency(entry.amount)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeletePayroll(entry)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

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
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={() => openEditSub(sub)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteSub(sub)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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

        {/* Edit Transaction Dialog */}
        <Dialog open={showEditTx} onOpenChange={setShowEditTx}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Amount</Label><Input type="number" value={editTxForm.amount} onChange={(e) => setEditTxForm({ ...editTxForm, amount: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={editTxForm.category} onValueChange={(v) => setEditTxForm({ ...editTxForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={editTxForm.description} onChange={(e) => setEditTxForm({ ...editTxForm, description: e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={editTxForm.date} onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleEditTransaction}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Transaction Dialog */}
        <Dialog open={showDeleteTx} onOpenChange={setShowDeleteTx}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Transaction</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            {deleteTarget && (
              <div className="p-3 rounded-lg border text-sm">
                <p><strong>{deleteTarget.description || 'No description'}</strong></p>
                <p className="text-muted-foreground">{deleteTarget.date} &middot; {formatCurrency(deleteTarget.amount)}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteTx(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTransaction}>Delete</Button>
            </DialogFooter>
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

        {/* Edit Bill Dialog */}
        <Dialog open={showEditBill} onOpenChange={setShowEditBill}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Bill</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editBillForm.name} onChange={(e) => setEditBillForm({ ...editBillForm, name: e.target.value })} /></div>
              <div><Label>Amount</Label><Input type="number" value={editBillForm.amount} onChange={(e) => setEditBillForm({ ...editBillForm, amount: e.target.value })} /></div>
              <div><Label>Frequency</Label>
                <Select value={editBillForm.frequency} onValueChange={(v) => setEditBillForm({ ...editBillForm, frequency: v })}>
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
              <div><Label>Due Day (1-31)</Label><Input type="number" min="1" max="31" value={editBillForm.due_day} onChange={(e) => setEditBillForm({ ...editBillForm, due_day: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleEditBill}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Bill Dialog */}
        <Dialog open={showDeleteBill} onOpenChange={setShowDeleteBill}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Bill</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this bill? This action cannot be undone.</p>
            {deleteTarget && (
              <div className="p-3 rounded-lg border text-sm">
                <p><strong>{deleteTarget.name}</strong></p>
                <p className="text-muted-foreground">{formatCurrency(deleteTarget.amount)} &middot; {deleteTarget.frequency}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteBill(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteBill}>Delete</Button>
            </DialogFooter>
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

        {/* Edit Subscription Dialog */}
        <Dialog open={showEditSub} onOpenChange={setShowEditSub}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Subscription</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editSubForm.name} onChange={(e) => setEditSubForm({ ...editSubForm, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" value={editSubForm.amount} onChange={(e) => setEditSubForm({ ...editSubForm, amount: e.target.value })} /></div>
                <div><Label>Frequency</Label>
                  <Select value={editSubForm.frequency} onValueChange={(v) => setEditSubForm({ ...editSubForm, frequency: v })}>
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
                <Select value={editSubForm.category} onValueChange={(v) => setEditSubForm({ ...editSubForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBSCRIPTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleEditSubscription}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Subscription Dialog */}
        <Dialog open={showDeleteSub} onOpenChange={setShowDeleteSub}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Subscription</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this subscription? This action cannot be undone.</p>
            {deleteTarget && (
              <div className="p-3 rounded-lg border text-sm">
                <p><strong>{deleteTarget.name}</strong></p>
                <p className="text-muted-foreground">{formatCurrency(deleteTarget.amount)} &middot; {deleteTarget.frequency}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteSub(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteSubscription(deleteTarget?.id)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Payroll Dialog */}
        <Dialog open={showAddPayroll} onOpenChange={setShowAddPayroll}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Payroll</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={payrollForm.name} onChange={(e) => setPayrollForm({ ...payrollForm, name: e.target.value })} placeholder="Company name or pay source" /></div>
              <div><Label>Amount</Label><Input type="number" value={payrollForm.amount} onChange={(e) => setPayrollForm({ ...payrollForm, amount: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Frequency</Label>
                <Select value={payrollForm.frequency} onValueChange={(v) => setPayrollForm({ ...payrollForm, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAddPayroll}>Add Payroll</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payroll Dialog */}
        <Dialog open={showDeletePayroll} onOpenChange={setShowDeletePayroll}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Payroll Entry</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this payroll entry? This action cannot be undone.</p>
            {deleteTarget && (
              <div className="p-3 rounded-lg border text-sm">
                <p><strong>{deleteTarget.description}</strong></p>
                <p className="text-muted-foreground">{formatCurrency(deleteTarget.amount)}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeletePayroll(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeletePayrollEntry}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
