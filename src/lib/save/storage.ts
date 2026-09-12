/**
 * The localStorage half, which knows nothing about the game. One key per save
 * rather than one blob: a blob is rewritten whole on every write, and one bad
 * parse takes every save with it.
 *
 * Loading cannot happen in place — every producer schedules itself on a real
 * `setTimeout`, so swapping the graph under them leaves orphaned clocks still
 * paying out. So a load parks a name in `PENDING_KEY` and reloads the page; the
 * module graph is the reset, and a reload is the only way to get one.
 */

import { summarize, type SaveState, type SaveSummary } from './state';
import { migrate } from './migrate';

const PREFIX = 'karma-clicker:save:';
const PENDING_KEY = 'karma-clicker:pending';

export interface SaveEntry {
  name: string;
  summary: SaveSummary;
}

/**
 * A save is only ever read back through this, so a foreign or stale key is
 * skipped — and so migration has exactly one place to happen. The listing, the
 * existence check and the boot's pending load all come through here, which is
 * why an old save reads as loadable in the panel rather than only failing once
 * you pick it.
 *
 * The raise is not written back. A migrated save is only rewritten when the
 * player next saves over it, so opening the panel never edits anything on disk.
 */
function readState(name: string): SaveState | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (!raw) return;

    return migrate(JSON.parse(raw));
  } catch {
    return;
  }
}

/** Parsed once, here — the panel holds the summaries and never reparses to draw. */
export function list(): SaveEntry[] {
  const entries: SaveEntry[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;

      const name = key.slice(PREFIX.length);
      const state = readState(name);
      if (!state) continue;

      entries.push({ name, summary: summarize(state) });
    }
  } catch {
    return entries;
  }

  return entries.sort((a, b) => b.summary.savedAt - a.summary.savedAt);
}

export function write(name: string, state: SaveState) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(state));

    return true;
  } catch {
    return false;
  }
}

export function remove(name: string) {
  try {
    localStorage.removeItem(PREFIX + name);
  } catch {
    // A save that cannot be removed is not worth stopping for.
  }
}

export function exists(name: string) {
  return readState(name) !== undefined;
}

/** Named for the next boot to pick up. The reload is the caller's. */
export function setPending(name: string) {
  try {
    localStorage.setItem(PENDING_KEY, name);

    return true;
  } catch {
    return false;
  }
}

/**
 * Read once and cleared whatever happens, so a save that cannot be applied
 * cannot loop the boot on itself.
 */
export function takePending(): SaveState | undefined {
  try {
    const name = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    if (!name) return;

    return readState(name);
  } catch {
    return;
  }
}
