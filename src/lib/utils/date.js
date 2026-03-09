import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, 'MMM d, yyyy') : '';
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : '';
}

export function formatRelative(dateStr) {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : '';
}

export function toISODate(date) {
  return format(date || new Date(), 'yyyy-MM-dd');
}

export function toISODateTime() {
  return new Date().toISOString();
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = parseISO(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMonthRange(date) {
  const d = date || new Date();
  const start = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
  const end = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
  return { start, end };
}
