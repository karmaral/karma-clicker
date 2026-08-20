/**
 * The one clock game time is read from, so a simulated run can replace it and
 * fast-forward. Real time is the default — nothing in the shipped game changes.
 */

export interface Clock {
  now(): number;
  after(ms: number, fn: () => void): void;
}

const real: Clock = {
  now: () => Date.now(),
  after: (ms, fn) => { setTimeout(fn, ms); },
};

let current: Clock = real;

export const clock: Clock = {
  now: () => current.now(),
  after: (ms, fn) => current.after(ms, fn),
};

export function setClock(next: Clock) {
  current = next;
}

export function resetClock() {
  current = real;
}