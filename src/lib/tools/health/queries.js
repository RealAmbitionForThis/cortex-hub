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

// --- Sleep ---

export function logSleep({ bedtime, wake_time, duration_hours, quality, notes, date }) {
  const id = uuidv4();
  const d = date || new Date().toISOString().split('T')[0];
  // Auto-compute duration if not provided but times are
  let duration = duration_hours;
  if (!duration && bedtime && wake_time) {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wake_time.split(':').map(Number);
    let mins = (wH * 60 + wM) - (bH * 60 + bM);
    if (mins < 0) mins += 24 * 60; // handle midnight crossing
    duration = Math.round((mins / 60) * 100) / 100;
  }
  getDb().prepare(
    'INSERT OR REPLACE INTO sleep_logs (id, date, bedtime, wake_time, duration_hours, quality, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(id, d, bedtime || null, wake_time || null, duration || null, quality || null, notes || null);
  return id;
}

export function getSleepLogs(limit = 14) {
  return getDb().prepare('SELECT * FROM sleep_logs ORDER BY date DESC LIMIT ?').all(limit);
}

export function getSleepStats() {
  const db = getDb();
  const now = new Date();
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d7str = d7.toISOString().split('T')[0];
  const d30str = d30.toISOString().split('T')[0];

  const week = db.prepare('SELECT AVG(duration_hours) as avg_hours, AVG(quality) as avg_quality, COUNT(*) as count FROM sleep_logs WHERE date >= ?').get(d7str);
  const month = db.prepare('SELECT AVG(duration_hours) as avg_hours, AVG(quality) as avg_quality FROM sleep_logs WHERE date >= ?').get(d30str);

  // Streak: consecutive days with a sleep log ending today
  const allDates = db.prepare('SELECT date FROM sleep_logs ORDER BY date DESC').all();
  let streak = 0;
  const today = now.toISOString().split('T')[0];
  const checkDate = new Date(now);
  for (const row of allDates) {
    const expected = checkDate.toISOString().split('T')[0];
    if (row.date === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    avg_hours_7d: week.avg_hours ? Math.round(week.avg_hours * 10) / 10 : null,
    avg_quality_7d: week.avg_quality ? Math.round(week.avg_quality * 10) / 10 : null,
    nights_this_week: week.count,
    avg_hours_30d: month.avg_hours ? Math.round(month.avg_hours * 10) / 10 : null,
    avg_quality_30d: month.avg_quality ? Math.round(month.avg_quality * 10) / 10 : null,
    streak,
  };
}

export function getSleepMoodCorrelation() {
  const db = getDb();
  // Join sleep_logs with daily_logs on date, compare mood when sleep < 6hrs vs >= 7hrs
  const shortSleep = db.prepare(
    "SELECT AVG(CASE WHEN dl.mood = 'great' THEN 5 WHEN dl.mood = 'good' THEN 4 WHEN dl.mood = 'okay' THEN 3 WHEN dl.mood = 'bad' THEN 2 WHEN dl.mood = 'terrible' THEN 1 ELSE 3 END) as avg_mood, COUNT(*) as count FROM sleep_logs sl JOIN daily_logs dl ON sl.date = dl.date WHERE sl.duration_hours < 6"
  ).get();
  const goodSleep = db.prepare(
    "SELECT AVG(CASE WHEN dl.mood = 'great' THEN 5 WHEN dl.mood = 'good' THEN 4 WHEN dl.mood = 'okay' THEN 3 WHEN dl.mood = 'bad' THEN 2 WHEN dl.mood = 'terrible' THEN 1 ELSE 3 END) as avg_mood, COUNT(*) as count FROM sleep_logs sl JOIN daily_logs dl ON sl.date = dl.date WHERE sl.duration_hours >= 7"
  ).get();

  if (!shortSleep.count || !goodSleep.count || shortSleep.count < 2 || goodSleep.count < 2) {
    return { insight: 'Log more sleep entries to see mood correlations', short_sleep_mood: null, good_sleep_mood: null };
  }

  const diff = goodSleep.avg_mood - shortSleep.avg_mood;
  const pct = shortSleep.avg_mood > 0 ? Math.round((diff / shortSleep.avg_mood) * 100) : 0;
  const insight = pct > 0
    ? `Your mood is ${pct}% higher on nights with 7+ hours of sleep`
    : pct < 0
      ? `Surprisingly, your mood is ${Math.abs(pct)}% lower on nights with more sleep`
      : 'No clear correlation between sleep and mood yet';

  return {
    insight,
    short_sleep_mood: Math.round(shortSleep.avg_mood * 10) / 10,
    good_sleep_mood: Math.round(goodSleep.avg_mood * 10) / 10,
    short_sleep_nights: shortSleep.count,
    good_sleep_nights: goodSleep.count,
  };
}
