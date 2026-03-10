'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Car, Wrench, Fuel, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { MAINTENANCE_TYPES } from '@/lib/constants';

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [costs, setCosts] = useState({ maintenance: 0, fuel: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showAddMaint, setShowAddMaint] = useState(false);
  const [showAddFuel, setShowAddFuel] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', current_mileage: '', nickname: '' });
  const [editForm, setEditForm] = useState({ id: '', make: '', model: '', year: '', current_mileage: '', nickname: '' });
  const [maintForm, setMaintForm] = useState({ type: 'oil_change', description: '', cost: '', mileage: '' });
  const [fuelForm, setFuelForm] = useState({ gallons: '', cost_per_gallon: '', total_cost: '', mileage: '' });

  useEffect(() => { fetchVehicles(); }, []);
  useEffect(() => { if (selectedVehicle) fetchVehicleData(selectedVehicle); }, [selectedVehicle]);

  async function fetchVehicles() {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicle');
      if (res.ok) { const d = await res.json(); setVehicles(d.vehicles || []); if (d.vehicles?.length && !selectedVehicle) setSelectedVehicle(d.vehicles[0].id); }
    } catch { toast.error('Failed to load vehicles'); }
    setLoading(false);
  }

  async function fetchVehicleData(id) {
    await Promise.all([
      fetch(`/api/vehicle?vehicle_id=${id}&view=maintenance`).then(r => r.json()).then(d => setMaintenance(d.logs || [])).catch(() => {}),
      fetch(`/api/vehicle?vehicle_id=${id}&view=fuel`).then(r => r.json()).then(d => setFuelLogs(d.logs || [])).catch(() => {}),
      fetch(`/api/vehicle?vehicle_id=${id}&view=costs`).then(r => r.json()).then(setCosts).catch(() => {}),
    ]);
  }

  async function handleAddVehicle() {
    try {
      const res = await fetch('/api/vehicle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...vehicleForm, year: parseInt(vehicleForm.year), current_mileage: parseInt(vehicleForm.current_mileage) || undefined }) });
      if (res.ok) {
        toast.success('Vehicle added');
        setShowAddVehicle(false);
        setVehicleForm({ make: '', model: '', year: '', current_mileage: '', nickname: '' });
        fetchVehicles();
      } else { const d = await res.json(); toast.error(d.error || 'Failed to add vehicle'); }
    } catch { toast.error('Failed to add vehicle'); }
  }

  function openEditVehicle() {
    const v = vehicles.find(v => v.id === selectedVehicle);
    if (!v) return;
    setEditForm({ id: v.id, make: v.make, model: v.model, year: String(v.year), current_mileage: String(v.current_mileage || ''), nickname: v.nickname || '' });
    setShowEditVehicle(true);
  }

  async function handleEditVehicle() {
    try {
      const res = await fetch('/api/vehicle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, year: parseInt(editForm.year), current_mileage: parseInt(editForm.current_mileage) || null }),
      });
      if (res.ok) {
        toast.success('Vehicle updated');
        setShowEditVehicle(false);
        fetchVehicles();
      } else { toast.error('Failed to update vehicle'); }
    } catch { toast.error('Failed to update vehicle'); }
  }

  async function handleDeleteVehicle() {
    if (!selectedVehicle) return;
    try {
      const res = await fetch(`/api/vehicle?id=${selectedVehicle}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Vehicle deleted');
        setSelectedVehicle(null);
        fetchVehicles();
      } else { toast.error('Failed to delete vehicle'); }
    } catch { toast.error('Failed to delete vehicle'); }
  }

  async function handleAddMaintenance() {
    try {
      const res = await fetch('/api/vehicle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...maintForm, action: 'maintenance', vehicle_id: selectedVehicle, cost: parseFloat(maintForm.cost) || undefined, mileage: parseInt(maintForm.mileage) || undefined }) });
      if (res.ok) { toast.success('Maintenance logged'); setShowAddMaint(false); setMaintForm({ type: 'oil_change', description: '', cost: '', mileage: '' }); fetchVehicleData(selectedVehicle); }
      else { toast.error('Failed to log maintenance'); }
    } catch { toast.error('Failed to log maintenance'); }
  }

  async function handleAddFuel() {
    try {
      const res = await fetch('/api/vehicle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fuelForm, action: 'fuel', vehicle_id: selectedVehicle, gallons: parseFloat(fuelForm.gallons), cost_per_gallon: parseFloat(fuelForm.cost_per_gallon) || undefined, total_cost: parseFloat(fuelForm.total_cost) || undefined, mileage: parseInt(fuelForm.mileage) || undefined }) });
      if (res.ok) { toast.success('Fuel logged'); setShowAddFuel(false); setFuelForm({ gallons: '', cost_per_gallon: '', total_cost: '', mileage: '' }); fetchVehicleData(selectedVehicle); }
      else { toast.error('Failed to log fuel'); }
    } catch { toast.error('Failed to log fuel'); }
  }

  if (loading) return <AppShell title="Vehicle"><LoadingSpinner /></AppShell>;

  const vehicle = vehicles.find(v => v.id === selectedVehicle);

  return (
    <AppShell title="Vehicle">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddVehicle(true)}><Plus className="h-4 w-4 mr-2" /> Vehicle</Button>
          {selectedVehicle && <Button variant="outline" onClick={() => setShowAddMaint(true)}><Wrench className="h-4 w-4 mr-2" /> Maintenance</Button>}
          {selectedVehicle && <Button variant="outline" onClick={() => setShowAddFuel(true)}><Fuel className="h-4 w-4 mr-2" /> Fuel</Button>}
          {selectedVehicle && <Button variant="outline" onClick={openEditVehicle}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>}
          {selectedVehicle && <Button variant="outline" className="text-destructive" onClick={handleDeleteVehicle}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>}
        </div>

        {vehicles.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles" description="Add a vehicle to get started" />
        ) : (
          <>
            {vehicles.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {vehicles.map(v => (
                  <Button key={v.id} variant={selectedVehicle === v.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedVehicle(v.id)}>
                    {v.nickname || `${v.year} ${v.make} ${v.model}`}
                  </Button>
                ))}
              </div>
            )}

            {vehicle && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.current_mileage ? `\u2022 ${vehicle.current_mileage.toLocaleString()} mi` : ''}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Maintenance</p><p className="text-lg font-bold">{formatCurrency(costs.maintenance)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fuel</p><p className="text-lg font-bold">{formatCurrency(costs.fuel)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">{formatCurrency(costs.total)}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Maintenance History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {maintenance.length === 0 ? <p className="text-sm text-muted-foreground">No maintenance records</p> : maintenance.map(m => (
                  <div key={m.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                    <div><span className="font-medium capitalize">{m.type.replace('_', ' ')}</span>{m.description && <span className="text-muted-foreground"> \u2014 {m.description}</span>}</div>
                    <div className="text-right"><span>{m.date}</span>{m.cost && <span className="ml-2">{formatCurrency(m.cost)}</span>}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Add Vehicle */}
        <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
          <DialogContent><DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Make</Label><Input value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} /></div>
              <div><Label>Model</Label><Input value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} /></div>
              <div><Label>Year</Label><Input type="number" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} /></div>
              <div><Label>Current Mileage</Label><Input type="number" value={vehicleForm.current_mileage} onChange={e => setVehicleForm({...vehicleForm, current_mileage: e.target.value})} /></div>
              <div><Label>Nickname</Label><Input value={vehicleForm.nickname} onChange={e => setVehicleForm({...vehicleForm, nickname: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddVehicle}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Vehicle */}
        <Dialog open={showEditVehicle} onOpenChange={setShowEditVehicle}>
          <DialogContent><DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Make</Label><Input value={editForm.make} onChange={e => setEditForm({...editForm, make: e.target.value})} /></div>
              <div><Label>Model</Label><Input value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} /></div>
              <div><Label>Year</Label><Input type="number" value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} /></div>
              <div><Label>Current Mileage</Label><Input type="number" value={editForm.current_mileage} onChange={e => setEditForm({...editForm, current_mileage: e.target.value})} /></div>
              <div><Label>Nickname</Label><Input value={editForm.nickname} onChange={e => setEditForm({...editForm, nickname: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleEditVehicle}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Maintenance */}
        <Dialog open={showAddMaint} onOpenChange={setShowAddMaint}>
          <DialogContent><DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Type</Label><Select value={maintForm.type} onValueChange={v => setMaintForm({...maintForm, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Description</Label><Input value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} /></div>
              <div><Label>Cost</Label><Input type="number" value={maintForm.cost} onChange={e => setMaintForm({...maintForm, cost: e.target.value})} /></div>
              <div><Label>Mileage</Label><Input type="number" value={maintForm.mileage} onChange={e => setMaintForm({...maintForm, mileage: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddMaintenance}>Log</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Fuel */}
        <Dialog open={showAddFuel} onOpenChange={setShowAddFuel}>
          <DialogContent><DialogHeader><DialogTitle>Log Fuel</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Gallons</Label><Input type="number" step="0.01" value={fuelForm.gallons} onChange={e => setFuelForm({...fuelForm, gallons: e.target.value})} /></div>
              <div><Label>Cost Per Gallon</Label><Input type="number" step="0.01" value={fuelForm.cost_per_gallon} onChange={e => setFuelForm({...fuelForm, cost_per_gallon: e.target.value})} /></div>
              <div><Label>Total Cost</Label><Input type="number" step="0.01" value={fuelForm.total_cost} onChange={e => setFuelForm({...fuelForm, total_cost: e.target.value})} /></div>
              <div><Label>Mileage</Label><Input type="number" value={fuelForm.mileage} onChange={e => setFuelForm({...fuelForm, mileage: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddFuel}>Log</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
