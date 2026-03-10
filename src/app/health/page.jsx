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
import { Plus, Utensils, Dumbbell, Target, Flame, Moon, Star, Brain } from 'lucide-react';
import { MEAL_TYPES, WORKOUT_TYPES, SLEEP_QUALITY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function HealthPage() {
  const [data, setData] = useState({ stats: {}, meals: [], workouts: [], goals: [], sleep: [], sleep_stats: {} });
  const [loading, setLoading] = useState(true);
  const [showMeal, setShowMeal] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [mealForm, setMealForm] = useState({ description: '', calories: '', protein: '', meal_type: 'lunch' });
  const [workoutForm, setWorkoutForm] = useState({ type: 'strength', duration_minutes: '', notes: '' });
  const [sleepForm, setSleepForm] = useState({ bedtime: '23:00', wake_time: '07:00', quality: 3, notes: '' });
  const [sleepCorrelation, setSleepCorrelation] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [healthRes, corrRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health?view=sleep_stats'),
      ]);
      if (healthRes.ok) setData(await healthRes.json());
      if (corrRes.ok) {
        const d = await corrRes.json();
        setSleepCorrelation(d.correlation || null);
      }
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

  async function handleAddSleep() {
    await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sleepForm, type: 'sleep' }) });
    setShowSleep(false);
    setSleepForm({ bedtime: '23:00', wake_time: '07:00', quality: 3, notes: '' });
    fetchData();
  }

  if (loading) return <AppShell title="Health"><LoadingSpinner /></AppShell>;

  const { stats = {}, meals = [], workouts = [], sleep = [], sleep_stats = {} } = data;

  return (
    <AppShell title="Health">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowMeal(true)}><Utensils className="h-4 w-4 mr-2" /> Log Meal</Button>
          <Button variant="outline" onClick={() => setShowWorkout(true)}><Dumbbell className="h-4 w-4 mr-2" /> Log Workout</Button>
          <Button variant="outline" onClick={() => setShowSleep(true)}><Moon className="h-4 w-4 mr-2" /> Log Sleep</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Calories Today" value={stats.calories_today || 0} icon={Flame} />
          <StatCard title="Protein Today" value={`${stats.protein_today || 0}g`} icon={Target} />
          <StatCard title="Meals Today" value={stats.meals_today || 0} icon={Utensils} />
          <StatCard title="Workouts This Week" value={stats.workouts_this_week || 0} icon={Dumbbell} />
        </div>

        {/* Sleep Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Avg Sleep (7d)" value={sleep_stats.avg_hours_7d ? `${sleep_stats.avg_hours_7d}h` : '—'} icon={Moon} />
          <StatCard title="Avg Quality (7d)" value={sleep_stats.avg_quality_7d ? `${sleep_stats.avg_quality_7d}/5` : '—'} icon={Star} />
          <StatCard title="Nights Logged" value={sleep_stats.nights_this_week || 0} icon={Moon} />
          <StatCard title="Streak" value={sleep_stats.streak ? `${sleep_stats.streak}d` : '0d'} icon={Target} />
        </div>

        {/* Sleep-Mood Insight */}
        {sleepCorrelation?.insight && (
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm">{sleepCorrelation.insight}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Sleep</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sleep.length === 0 ? <p className="text-sm text-muted-foreground">No sleep logged</p> : sleep.map((s) => (
                <div key={s.id} className="text-sm p-2 bg-muted/50 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.duration_hours ? `${s.duration_hours}h` : '—'}</span>
                    <span className="text-muted-foreground">{s.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s.bedtime && <span>{s.bedtime} → {s.wake_time}</span>}
                    {s.quality && <Badge variant="secondary" className="text-[10px]">{SLEEP_QUALITY_LABELS[s.quality - 1]}</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Log Meal Dialog */}
        <Dialog open={showMeal} onOpenChange={setShowMeal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Meal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Description</Label><Input value={mealForm.description} onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Log Workout Dialog */}
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

        {/* Log Sleep Dialog */}
        <Dialog open={showSleep} onOpenChange={setShowSleep}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Sleep</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Bedtime</Label><Input type="time" value={sleepForm.bedtime} onChange={(e) => setSleepForm({ ...sleepForm, bedtime: e.target.value })} /></div>
                <div><Label>Wake Time</Label><Input type="time" value={sleepForm.wake_time} onChange={(e) => setSleepForm({ ...sleepForm, wake_time: e.target.value })} /></div>
              </div>
              <div>
                <Label>Quality</Label>
                <div className="flex gap-1 mt-1">
                  {SLEEP_QUALITY_LABELS.map((label, i) => (
                    <Button
                      key={i}
                      variant={sleepForm.quality === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setSleepForm({ ...sleepForm, quality: i + 1 })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div><Label>Notes</Label><Input value={sleepForm.notes} onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })} placeholder="How did you sleep?" /></div>
            </div>
            <DialogFooter><Button onClick={handleAddSleep}>Log Sleep</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
