'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Plus, Utensils, Dumbbell, Target, Flame } from 'lucide-react';
import { parseJsonSafe } from '@/lib/utils/format';
import { MEAL_TYPES, WORKOUT_TYPES } from '@/lib/constants';

export default function HealthPage() {
  const [data, setData] = useState({ stats: {}, meals: [], workouts: [], goals: [] });
  const [loading, setLoading] = useState(true);
  const [showMeal, setShowMeal] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);
  const [mealForm, setMealForm] = useState({ description: '', calories: '', protein: '', meal_type: 'lunch' });
  const [workoutForm, setWorkoutForm] = useState({ type: 'strength', duration_minutes: '', notes: '' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleAddMeal() {
    await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...mealForm, type: 'meal', calories: parseInt(mealForm.calories) || undefined, protein: parseFloat(mealForm.protein) || undefined }) });
    setShowMeal(false);
    fetchData();
  }

  async function handleAddWorkout() {
    await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...workoutForm, type: 'workout', duration_minutes: parseInt(workoutForm.duration_minutes) || undefined }) });
    setShowWorkout(false);
    fetchData();
  }

  if (loading) return <AppShell title="Health"><LoadingSpinner /></AppShell>;

  const { stats = {}, meals = [], workouts = [], goals = [] } = data;

  return (
    <AppShell title="Health">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex gap-2">
          <Button onClick={() => setShowMeal(true)}><Utensils className="h-4 w-4 mr-2" /> Log Meal</Button>
          <Button variant="outline" onClick={() => setShowWorkout(true)}><Dumbbell className="h-4 w-4 mr-2" /> Log Workout</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Calories Today" value={stats.calories_today || 0} icon={Flame} />
          <StatCard title="Protein Today" value={`${stats.protein_today || 0}g`} icon={Target} />
          <StatCard title="Meals Today" value={stats.meals_today || 0} icon={Utensils} />
          <StatCard title="Workouts This Week" value={stats.workouts_this_week || 0} icon={Dumbbell} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Today&apos;s Meals</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {meals.length === 0 ? <p className="text-sm text-muted-foreground">No meals logged today</p> : meals.map((m) => (
                <div key={m.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{m.description}</span>
                  <span className="text-muted-foreground">{m.calories ? `${m.calories} cal` : ''}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Workouts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {workouts.length === 0 ? <p className="text-sm text-muted-foreground">No workouts logged</p> : workouts.map((w) => (
                <div key={w.id} className="text-sm p-2 bg-muted/50 rounded">
                  <div className="flex justify-between"><span className="font-medium capitalize">{w.type}</span><span className="text-muted-foreground">{w.date}</span></div>
                  {w.duration_minutes && <span className="text-xs text-muted-foreground">{w.duration_minutes} min</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showMeal} onOpenChange={setShowMeal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Meal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Description</Label><Input value={mealForm.description} onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Calories</Label><Input type="number" value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} /></div>
                <div><Label>Protein (g)</Label><Input type="number" value={mealForm.protein} onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })} /></div>
              </div>
              <div><Label>Meal Type</Label>
                <Select value={mealForm.meal_type} onValueChange={(v) => setMealForm({ ...mealForm, meal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MEAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAddMeal}>Log Meal</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showWorkout} onOpenChange={setShowWorkout}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Workout</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Type</Label>
                <Select value={workoutForm.type} onValueChange={(v) => setWorkoutForm({ ...workoutForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WORKOUT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Duration (minutes)</Label><Input type="number" value={workoutForm.duration_minutes} onChange={(e) => setWorkoutForm({ ...workoutForm, duration_minutes: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={workoutForm.notes} onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddWorkout}>Log Workout</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <Icon className="h-8 w-8 text-muted-foreground shrink-0" />
      <div><p className="text-xs text-muted-foreground">{title}</p><p className="text-lg font-bold">{value}</p></div>
    </CardContent></Card>
  );
}
