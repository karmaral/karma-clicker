import type { Clock } from '$lib/clock';

interface Entry {
  at: number;
  /** Ties break by scheduling order, so two payouts landing together stay FIFO. */
  seq: number;
  fn: () => void;
}

/**
 * Only ever a handful pending — every emitter holds one timer at a time — so
 * the due entry is scanned for rather than heaped.
 */
const MAX_PER_ADVANCE = 1_000_000;

/** Game time with the wall taken out of it. `advanceTo` is the only thing that moves it. */
export default class VirtualClock implements Clock {
  #now = 0;
  #seq = 0;
  #pending: Entry[] = [];

  now() { return this.#now; }

  after(ms: number, fn: () => void) {
    this.#pending.push({ at: this.#now + Math.max(0, ms), seq: this.#seq++, fn });
  }

  /**
   * Runs everything due, in order, with `now` standing at each entry's own time
   * while it runs — a payout must not see the end of the window it landed in.
   */
  advanceTo(at: number) {
    let ran = 0;

    for (let due = this.#takeDue(at); due; due = this.#takeDue(at)) {
      if (++ran > MAX_PER_ADVANCE) {
        throw new Error('VirtualClock: a payout kept rescheduling itself inside one advance');
      }

      this.#now = due.at;
      due.fn();
    }

    this.#now = at;
  }

  advanceBy(ms: number) {
    this.advanceTo(this.#now + ms);
  }

  #takeDue(limit: number) {
    let pick = -1;

    for (let i = 0; i < this.#pending.length; i++) {
      const entry = this.#pending[i];
      if (entry.at > limit) continue;
      if (pick < 0) {
        pick = i;
        continue;
      }

      const best = this.#pending[pick];
      if (entry.at < best.at || (entry.at === best.at && entry.seq < best.seq)) pick = i;
    }

    if (pick < 0) return undefined;

    return this.#pending.splice(pick, 1)[0];
  }
}