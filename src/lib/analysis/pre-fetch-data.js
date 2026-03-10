import { getDb } from '@/lib/db';

/**
 * Pre-fetches data from the database based on the analysis result's required_context.
 * Each key maps to a specific DB query that loads relevant data for the main LLM call.
 */
export function preFetchData(recentDataKeys) {
  if (!Array.isArray(recentDataKeys) || recentDataKeys.length === 0) {
    return {};
  }

  const db = getDb();
  const result = {};

  for (const key of recentDataKeys) {
    try {
      const fetcher = DATA_FETCHERS[key];
      if (fetcher) {
        result[key] = fetcher(db);
      }
    } catch (err) {
      console.error(`[pre-fetch] Failed to fetch "${key}":`, err?.message ?? err);
    }
  }

  return result;
}

const DATA_FETCHERS = {
  recent_transactions(db) {
    try {
      return db.prepare(
        'SELECT amount, category, description, date FROM transactions ORDER BY date DESC LIMIT 10'
      ).all();
    } catch {
      return [];
    }
  },

  active_budgets(db) {
    try {
      const budgets = db.prepare(
        'SELECT category, amount, period FROM budgets WHERE active = 1'
      ).all();

      // Enrich with spent amounts for current month
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      for (const budget of budgets) {
        try {
          const spent = db.prepare(
            'SELECT COALESCE(SUM(ABS(amount)), 0) as spent FROM transactions WHERE category = ? AND date >= ? AND amount < 0'
          ).get(budget.category, monthStart);
          budget.spent = spent?.spent ?? 0;
        } catch {
          budget.spent = 0;
        }
      }
      return budgets;
    } catch {
      return [];
    }
  },

  upcoming_tasks(db) {
    try {
      const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      return db.prepare(
        "SELECT title, due_date, priority, status FROM tasks WHERE status NOT IN ('done', 'cancelled') AND (due_date IS NULL OR due_date <= ?) ORDER BY due_date ASC LIMIT 15"
      ).all(weekFromNow);
    } catch {
      return [];
    }
  },

  upcoming_bills(db) {
    try {
      const twoWeeksFromNow = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      return db.prepare(
        'SELECT name, amount, due_date, frequency, category FROM bills WHERE due_date <= ? AND paid = 0 ORDER BY due_date ASC LIMIT 10'
      ).all(twoWeeksFromNow);
    } catch {
      return [];
    }
  },

  health_goals(db) {
    try {
      return db.prepare(
        'SELECT type, target, current, unit, deadline FROM health_goals WHERE active = 1'
      ).all();
    } catch {
      return [];
    }
  },

  recent_workouts(db) {
    try {
      return db.prepare(
        'SELECT type, duration_minutes, notes, created_at FROM workouts ORDER BY created_at DESC LIMIT 5'
      ).all();
    } catch {
      return [];
    }
  },

  recent_meals(db) {
    try {
      return db.prepare(
        'SELECT description, calories, protein, carbs, fat, meal_type, created_at FROM meals ORDER BY created_at DESC LIMIT 5'
      ).all();
    } catch {
      return [];
    }
  },

  vehicle_mileage(db) {
    try {
      return db.prepare(
        'SELECT name, make, model, year, mileage FROM vehicles'
      ).all();
    } catch {
      return [];
    }
  },

  recent_maintenance(db) {
    try {
      return db.prepare(
        'SELECT v.name as vehicle, m.type, m.description, m.cost, m.date FROM maintenance_logs m LEFT JOIN vehicles v ON m.vehicle_id = v.id ORDER BY m.date DESC LIMIT 5'
      ).all();
    } catch {
      return [];
    }
  },

  upcoming_followups(db) {
    try {
      const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      return db.prepare(
        'SELECT c.name, c.relationship, i.notes, i.follow_up_date FROM interactions i JOIN contacts c ON i.contact_id = c.id WHERE i.follow_up_date IS NOT NULL AND i.follow_up_date <= ? ORDER BY i.follow_up_date ASC LIMIT 10'
      ).all(weekFromNow);
    } catch {
      return [];
    }
  },
};
