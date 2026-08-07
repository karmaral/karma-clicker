const MAX_ENTRIES = 40;

export interface LogEntry {
  id: number;
  at: number;
  text: string;
}

const started = Date.now();
let nextId = 0;

let entries = $state<LogEntry[]>([]);

export function elapsed(at: number) {
  const total = Math.floor(at / 1000);
  const seconds = String(total % 60).padStart(2, '0');
  const minutes = String(Math.floor(total / 60) % 60).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  if (hours > 0) return `${hours}:${minutes}:${seconds}`;

  return `${minutes}:${seconds}`;
}

export const log = {
  get entries() { return entries; },

  add(text: string) {
    nextId += 1;
    entries = [{ id: nextId, at: Date.now() - started, text }, ...entries].slice(0, MAX_ENTRIES);
  },
};
