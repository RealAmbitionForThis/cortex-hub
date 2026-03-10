import { success, error, badRequest } from '@/lib/api/response';
import { addImportantDate, getImportantDates, updateImportantDate, deleteImportantDate, getUpcomingReminders, getDateStats, getTimeline } from '@/lib/tools/dates/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'stats') {
      return success(getDateStats());
    }

    if (view === 'reminders') {
      return success({ reminders: getUpcomingReminders() });
    }

    if (view === 'timeline') {
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : undefined;
      return success({ events: getTimeline(year) });
    }

    const type = searchParams.get('type') || undefined;
    const upcoming_days = searchParams.get('upcoming_days') ? parseInt(searchParams.get('upcoming_days')) : undefined;
    const past = searchParams.get('past') === 'true';
    const dates = getImportantDates({ type, upcoming_days, past: past || undefined });
    const stats = getDateStats();
    return success({ dates, stats });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'update') {
      if (!body.id) return badRequest('Date ID required');
      updateImportantDate(body.id, body);
      return success();
    }

    if (body.action === 'delete') {
      if (!body.id) return badRequest('Date ID required');
      deleteImportantDate(body.id);
      return success();
    }

    if (!body.title || !body.date) return badRequest('Title and date are required');
    const id = addImportantDate(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
