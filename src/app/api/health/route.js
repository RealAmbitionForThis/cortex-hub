import { success, error, badRequest } from '@/lib/api/response';
import { logMeal, logWorkout, getMeals, getWorkouts, getHealthStats, setHealthGoal, getHealthGoals } from '@/lib/tools/health/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    if (view === 'stats') return success(getHealthStats());
    if (view === 'meals') return success({ meals: getMeals(searchParams.get('date')) });
    if (view === 'workouts') return success({ workouts: getWorkouts() });
    if (view === 'goals') return success({ goals: getHealthGoals() });
    return success({ stats: getHealthStats(), meals: getMeals(), workouts: getWorkouts(5), goals: getHealthGoals() });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.type === 'meal') {
      if (!body.description) return badRequest('Description required');
      const id = logMeal(body);
      return success({ id });
    }
    if (body.type === 'workout') {
      if (!body.type) return badRequest('Workout type required');
      const id = logWorkout(body);
      return success({ id });
    }
    if (body.type === 'goal') {
      setHealthGoal(body);
      return success();
    }
    return badRequest('Invalid type. Use meal, workout, or goal.');
  } catch (err) {
    return error(err.message);
  }
}
