import { NextResponse } from 'next/server';
import { logMeal, logWorkout, getMeals, getWorkouts, getHealthStats, setHealthGoal, getHealthGoals } from '@/lib/tools/health/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    if (view === 'stats') return NextResponse.json(getHealthStats());
    if (view === 'meals') return NextResponse.json({ meals: getMeals(searchParams.get('date')) });
    if (view === 'workouts') return NextResponse.json({ workouts: getWorkouts() });
    if (view === 'goals') return NextResponse.json({ goals: getHealthGoals() });
    return NextResponse.json({ stats: getHealthStats(), meals: getMeals(), workouts: getWorkouts(5), goals: getHealthGoals() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.type === 'meal') { const id = logMeal(body); return NextResponse.json({ id, success: true }); }
    if (body.type === 'workout') { const id = logWorkout(body); return NextResponse.json({ id, success: true }); }
    if (body.type === 'goal') { setHealthGoal(body); return NextResponse.json({ success: true }); }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
