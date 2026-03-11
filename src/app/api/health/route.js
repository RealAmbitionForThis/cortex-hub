import { success, badRequest, withHandler } from '@/lib/api/response';
import { logMeal, logWorkout, getMeals, getWorkouts, getHealthStats, setHealthGoal, getHealthGoals, logSleep, getSleepLogs, getSleepStats, getSleepMoodCorrelation } from '@/lib/tools/health/queries';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  if (view === 'stats') return success(getHealthStats());
  if (view === 'meals') return success({ meals: getMeals(searchParams.get('date')) });
  if (view === 'workouts') return success({ workouts: getWorkouts() });
  if (view === 'goals') return success({ goals: getHealthGoals() });
  if (view === 'sleep') return success({ sleep: getSleepLogs() });
  if (view === 'sleep_stats') return success({ sleep_stats: getSleepStats(), correlation: getSleepMoodCorrelation() });
  return success({ stats: getHealthStats(), meals: getMeals(), workouts: getWorkouts(5), goals: getHealthGoals(), sleep: getSleepLogs(7), sleep_stats: getSleepStats() });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (body.type === 'meal') {
    if (!body.description) return badRequest('Description required');
    const id = logMeal(body);
    return success({ id });
  }
  if (body.type === 'workout') {
    if (!body.exercises && !body.duration_minutes) return badRequest('Exercises or duration required');
    const id = logWorkout(body);
    return success({ id });
  }
  if (body.type === 'goal') {
    setHealthGoal(body);
    return success();
  }
  if (body.type === 'sleep') {
    if (!body.bedtime && !body.wake_time && !body.duration_hours) return badRequest('Bedtime/wake time or duration required');
    const id = logSleep(body);
    return success({ id });
  }
  return badRequest('Invalid type. Use meal, workout, sleep, or goal.');
});
