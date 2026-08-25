/**
 * A narrative window over the whole progression, not a ledger of every mutation.
 * Three writers: `add` writes a line, `once` writes it at most ever, and
 * `accumulate` lets a repeating event hold one row and count rather than push.
 */

const MAX_ENTRIES = 40;

/** Repeats landing inside this window share a row. */
const COALESCE_MS = 2000;

export interface LogEntry {
  id: number;
  /** Present only while a row can still absorb repeats. */
  key?: string;
  count: number;
  text: string;
  /** Once-only reveals (beats, moments) — bold in the log, and toasted. */
  highlight?: boolean;
}

type Format = (count: number) => string;

let nextId = 0;
let entries = $state<LogEntry[]>([]);

/** Keys already written, so `once` survives a dev scrub to beat 0 and back up. */
const written = new Set<string>();

const pending = new Map<string, { count: number; format: Format }>();
let timer: ReturnType<typeof setTimeout> | undefined;

function prepend(text: string, key?: string, count = 1, highlight = false) {
  nextId += 1;
  entries = [{ id: nextId, key, count, text, highlight }, ...entries].slice(0, MAX_ENTRIES);
}

/** Only the head absorbs — once anything else lands, the run is closed. */
function absorb(key: string, count: number, format: Format) {
  const head = entries[0];
  if (head?.key !== key) {
    prepend(format(count), key, count);
    return;
  }

  head.count += count;
  head.text = format(head.count);
}

function flush() {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }

  pending.forEach(({ count, format }, key) => absorb(key, count, format));
  pending.clear();
}

export const log = {
  get entries() { return entries; },

  /** Held repeats land first, so the order stays honest. */
  add(text: string) {
    flush();
    prepend(text);
  },

  once(key: string, text: string) {
    if (written.has(key)) return;

    written.add(key);
    flush();
    prepend(text, undefined, 1, true);
  },

  accumulate(key: string, format: Format) {
    const held = pending.get(key);
    if (held) held.count += 1;
    else pending.set(key, { count: 1, format });

    if (timer !== undefined) return;

    timer = setTimeout(flush, COALESCE_MS);
  },
};
