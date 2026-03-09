import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function logMeal({ description, calories, protein, carbs, fat, meal_type, date }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO meals (id, description, calories, protein, carbs, fat, meal_type, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, description, calories || null, protein || null, carbs || null, fat || null, meal_type || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function logWorkout({ type, exercises, duration_minutes, notes, date }) {
  const id = uuidv4();
  getDb().prepare(
    'INSERT INTO workouts (id, type, exercises, duration_minutes, notes, date, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, type, exercises ? JSON.stringify(exercises) : null, duration_minutes || null, notes || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function getMeals(date) {
  const d = date || new Date().toISOString().split('T')[0];
  return getDb().prepare('SELECT * FROM meals WHERE date = ? ORDER BY created_at').all(d);
}

export function getWorkouts(limit = 20) {
  return getDb().prepare('SELECT * FROM workouts ORDER BY date DESC LIMIT ?').all(limit);
}

export function getHealthStats() {
  const today = new Date().toISOString().split('T')[0];
  const meals = getDb().prepare('SELECT * FROM meals WHERE date = ?').all(today);
  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekWorkouts = getDb().prepare('SELECT COUNT(*) as count FROM workouts WHERE date >= ?').get(weekAgo.toISOString().split('T')[0]);

  return { calories_today: totalCals, protein_today: totalProtein, workouts_this_week: weekWorkouts.count, meals_today: meals.length };
}

export function setHealthGoal({ type, target, unit }) {
  const id = uuidv4();
  getDb().prepare('INSERT OR REPLACE INTO health_goals (id, type, target, unit, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, type, target, unit);
}

export function getHealthGoals() {
  return getDb().prepare('SELECT * FROM health_goals').all();
}
