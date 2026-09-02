import { clock } from '$lib/clock';

export type Listener = (detail?: Record<string, unknown>) => void;

/** Events the emitter owns. Anything composing one routes these through to it. */
export const EMITTER_EVENTS = ['queue', 'action'];

/** The clock half of a producer. The payout is injected. */
export default class ResourceEmitter {
  /** What it returns rides out on `action` — a payout with nothing to say returns nothing. */
  #payout: () => Record<string, unknown> | void;
  #getDuration: () => number;
  #duration = $derived.by(() => this.#getDuration());
  #isAutonomous = $state(false);
  #isInProgress = $state(false);
  #nextAt = $state(0);

  #listeners: Record<string, Listener[]> = {
    queue: [],
    action: [],
  };

  constructor(payout: () => Record<string, unknown> | void, duration: number | (() => number) = 0) {
    this.#payout = payout;
    this.#getDuration = typeof duration === 'function' ? duration : () => duration;
  }

  queue() {
    this.#isInProgress = true;

    const duration = this.#duration;
    this.#nextAt = clock.now() + duration;

    if (!duration) {
      this.emit();
    } else {
      clock.after(duration, () => this.emit());
      // when duration becomes ridiculously small, probably just tick by seconds
    }

    this.#runCallbacks('queue', { duration });
  }

  emit() {
    // The clock fires whether or not the payout found anything to pay, so what
    // it did is the only way a listener can tell a real pull from an empty one.
    const detail = this.#payout() as Record<string, unknown> | undefined;
    this.#runCallbacks('action', detail);

    this.#isInProgress = false;

    // A clock with no interval is not a clock. Queueing emits at once when the
    // duration is 0, so re-queueing here would recurse until the stack goes.
    if (this.#isAutonomous && this.#duration) {
      this.queue();
    }
  }

  /** Flips the flag only. When it may start is the owner's call. */
  toggleAutonomy(toggle?: boolean) {
    this.#isAutonomous = toggle ?? !this.#isAutonomous;
  }

  get duration() { return this.#duration; }

  /** When the queued batch lands, for anything drawing a countdown. */
  get nextAt() { return this.#nextAt; }

  get isAutonomous() { return this.#isAutonomous; }
  get isInProgress() { return this.#isInProgress; }

  addListener(identifier: string, fn: Listener) {
    this.#listeners[identifier].push(fn);
  }

  removeListener(identifier: string, fn: Listener) {
    this.#listeners[identifier] = this.#listeners[identifier].filter((cb) => cb !== fn);
  }

  #runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (!(identifier in this.#listeners)) return;

    this.#listeners[identifier].forEach((callback) => callback(detail));
  }
}
