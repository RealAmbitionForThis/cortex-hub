import { logMeal, logWorkout, getHealthStats, setHealthGoal, getHealthGoals, logSleep, getSleepStats, getSleepMoodCorrelation } from './queries';

export const healthTools = [
  {
    name: 'health.log_meal',
    description: 'Log a meal with optional nutritional info',
    parameters: { type: 'object', properties: { description: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, meal_type: { type: 'string' } }, required: ['description'] },
    handler: (p) => ({ success: true, id: logMeal(p) }),
  },
  {
    name: 'health.log_workout',
    description: 'Log a workout session',
    parameters: { type: 'object', properties: { type: { type: 'string' }, exercises: { type: 'array' }, duration_minutes: { type: 'number' }, notes: { type: 'string' } }, required: ['type'] },
    handler: (p) => ({ success: true, id: logWorkout(p) }),
  },
  {
    name: 'health.get_stats',
    description: 'Get nutrition and workout summary',
    parameters: { type: 'object', properties: { period: { type: 'string' } } },
    handler: () => getHealthStats(),
  },
  {
    name: 'health.set_goal',
    description: 'Set a health goal',
    parameters: { type: 'object', properties: { type: { type: 'string' }, target: { type: 'number' }, unit: { type: 'string' } }, required: ['type', 'target', 'unit'] },
    handler: (p) => { setHealthGoal(p); return { success: true }; },
  },
  {
    name: 'health.get_progress',
    description: 'Get progress toward health goals',
    parameters: { type: 'object', properties: { type: { type: 'string' } } },
    handler: () => ({ goals: getHealthGoals(), stats: getHealthStats() }),
  },
  {
    name: 'health.log_sleep',
    description: 'Log a sleep entry with bedtime, wake time, and quality rating (1-5)',
    parameters: { type: 'object', properties: { bedtime: { type: 'string', description: 'HH:MM format' }, wake_time: { type: 'string', description: 'HH:MM format' }, quality: { type: 'number', description: '1-5 rating' }, notes: { type: 'string' }, date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' } }, required: ['bedtime', 'wake_time'] },
    handler: (p) => ({ success: true, id: logSleep(p) }),
  },
  {
    name: 'health.get_sleep_stats',
    description: 'Get sleep statistics including averages, streak, and trends',
    parameters: { type: 'object', properties: {} },
    handler: () => getSleepStats(),
  },
  {
    name: 'health.get_sleep_insights',
    description: 'Get sleep-mood correlation insights',
    parameters: { type: 'object', properties: {} },
    handler: () => getSleepMoodCorrelation(),
  },
];
