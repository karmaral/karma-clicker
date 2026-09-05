import { clock } from '$lib/clock';
import balance from '$data/balance';

export type Listener = (detail?: Record<string, unknown>) => void;

/** Events the emitter owns. Anything composing one routes these through to it. */
export const EMITTER_EVENTS = ['queue', 'action'];

/** The clock half of a producer. The payout is injected. */
export default class ResourceEmitter {
  /**
   * What it returns rides out on `action` — a payout with nothing to say returns
   * nothing. It is handed how many of its own cycles this call covers, which is
   * 1 for every clock slow enough to be watched and a fraction over it for a
   * stream; a payout that ignores the figure quietly loses everything a stream
   * batched, so every one of them has to spend it.
   */
  #payout: (batch: number) => Record<string, unknown> | void;
  #getDuration: () => number;
  #duration = $derived.by(() => this.#getDuration());
  #isAutonomous = $state(false);
  #isInProgress = $state(false);
  #nextAt = $state(0);

  /** What the queued payout covers, in cycles. Set by `queue`, spent by `emit`. */
  #batch = 1;

  /** The wait in flight, and when it notionally began. What `retime` measures against. */
  #queuedAt = 0;
  #queuedWait = 0;

  /**
   * The timer allowed to land. `clock.after` has no cancel — a re-armed wait
   * leaves the old one pending, and this is how it comes back to nothing.
   */
  #epoch = 0;

  /**
   * A clock too fast to read as a clock. It is the *autonomous* run that streams
   * and never a single send: one press buys one life however short it is, and
   * batching that would pay for lives nobody asked for.
   *
   * 0 is not a stream but the synchronous path — an emitter with no interval has
   * no rate, and an infinite one has no batch to work out.
   */
  #isStreaming = $derived(
    this.#isAutonomous && this.#duration > 0 && this.#duration <= balance.emission.streamUnder,
  );

  #listeners: Record<string, Listener[]> = {
    queue: [],
    action: [],
  };

  constructor(
    payout: (batch: number) => Record<string, unknown> | void,
    duration: number | (() => number) = 0,
  ) {
    this.#payout = payout;
    this.#getDuration = typeof duration === 'function' ? duration : () => duration;
  }

  queue() {
    this.#arm(0);
  }

  /**
   * Re-hangs the wait in flight on the duration as it stands now, keeping the
   * share of it already served. An upgrade that halves the clock halves what is
   * left of *this* cycle too, rather than landing only on the next one — work
   * done is work done, so the fraction carries and never the remaining ms.
   *
   * A no-op unless a wait is actually pending, so an owner may call it on every
   * change without asking whether the clock is running.
   */
  retime() {
    if (!this.#isInProgress || !this.#queuedWait) return;

    this.#arm(Math.min(1, (clock.now() - this.#queuedAt) / this.#queuedWait));
  }

  /**
   * One wait, `progress` of the way through it already. A stream's tick is a
   * fixed cadence, so the share carries it across unchanged and only the batch
   * is re-derived — one tick's worth of it priced at the new rate, which is the
   * bounded slop that buys the whole thing having no streaming branch.
   */
  #arm(progress: number) {
    this.#isInProgress = true;

    const duration = this.#duration;
    const isStreaming = this.#isStreaming;

    // A stream waits the tick rather than the life, and pays however many lives
    // fit in it — fractional, so the ledger comes to exactly what the same lives
    // would have paid one at a time. Floored at one life: an authored tick under
    // the threshold is a mistake, and paying *less* than was earned is the one
    // way this could be wrong that nobody would see.
    const wait = isStreaming ? balance.emission.streamTick : duration;
    const remaining = wait * (1 - progress);

    this.#batch = isStreaming ? Math.max(1, wait / duration) : 1;

    // Backdated, not stamped: the next `retime` measures its share against the
    // start this wait would have had if it had always been this long.
    this.#queuedAt = clock.now() - wait * progress;
    this.#queuedWait = wait;
    this.#nextAt = clock.now() + remaining;

    const epoch = ++this.#epoch;

    if (!remaining) {
      this.emit();
    } else {
      clock.after(remaining, () => { if (epoch === this.#epoch) this.emit(); });
    }

    // `retimed` says the cycle is the same cycle and only its clock moved —
    // anything that stamped something when this one began must not stamp again.
    this.#runCallbacks('queue', {
      duration: wait, remaining, streaming: isStreaming, retimed: progress > 0,
    });
  }

  emit() {
    // Read and put back, so an `emit` called on its own — a send, a test — pays
    // one cycle whatever the last queued batch happened to be.
    const batch = this.#batch;
    this.#batch = 1;

    // Retires the wait this pays for, so a timer still pending against it — an
    // `emit` called by hand, or one the last `retime` outran — lands on nothing.
    this.#epoch += 1;
    this.#queuedWait = 0;

    // The clock fires whether or not the payout found anything to pay, so what
    // it did is the only way a listener can tell a real pull from an empty one.
    const detail = this.#payout(batch) as Record<string, unknown> | undefined;
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

  /** Paying by the tick rather than by the life. Anything drawing a clock wants it. */
  get isStreaming() { return this.#isStreaming; }

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
