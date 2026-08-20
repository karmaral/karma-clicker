import { f } from '$lib/utils';

/** Run time as a player would say it. Seconds in, never milliseconds. */
export function clockTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '—';

  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes) return `${minutes}m ${String(rest).padStart(2, '0')}s`;

  return `${rest}s`;
}

const HOUR = 3600;
const DAY = 86_400;
const YEAR = 31_557_600;

/**
 * The same duration at any magnitude. `clockTime` reads a run and so stops at
 * hours; payback does not stop anywhere — a cohort earning almost nothing repays
 * in figures whose digits say less than their order does. Two units, always.
 */
export function span(seconds: number) {
  if (!Number.isFinite(seconds)) return '—';
  if (seconds < DAY) return clockTime(seconds);

  if (seconds < YEAR) {
    const days = Math.floor(seconds / DAY);
    const hours = Math.floor((seconds % DAY) / HOUR);

    return `${days}d ${String(hours).padStart(2, '0')}h`;
  }

  const years = seconds / YEAR;

  // Past `f`'s last suffix the label would read "Infinity", which is a longer
  // way of saying what the axis already shows.
  return years >= 1e30 ? 'never' : `${f(years)}y`;
}

/** `f` compacts magnitude but not sign, and excess is signed. */
export function figure(value: number) {
  if (!Number.isFinite(value)) return '—';

  return `${value < 0 ? '−' : ''}${f(Math.abs(value))}`;
}
