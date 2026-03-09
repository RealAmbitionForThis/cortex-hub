import { logMeal, logWorkout, getHealthStats, setHealthGoal, getHealthGoals } from './queries';

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
];
