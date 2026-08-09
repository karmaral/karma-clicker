type Listener = (detail?: Record<string, unknown>) => void;

/** Events the emitter owns. Anything composing one routes these through to it. */
export const EMITTER_EVENTS = ['queue', 'action'];

/** The clock half of a producer. The payout is injected. */
export default class ResourceEmitter {
  #payout: () => void;
  #getDuration: () => number;
  #duration = $derived.by(() => this.#getDuration());
  #autonomous = $state(false);
  #inProgress = $state(false);

  #listeners: Record<string, Listener[]> = {
    queue: [],
    action: [],
  };

  constructor(payout: () => void, duration: number | (() => number) = 0) {
    this.#payout = payout;
    this.#getDuration = typeof duration === 'function' ? duration : () => duration;
  }

  queue() {
    this.#inProgress = true;

    const duration = this.#duration;
    if (!duration) {
      this.emit();
    } else {
      setTimeout(() => this.emit(), duration);
      // when duration becomes ridiculously small, probably just tick by seconds
    }

    this.#runCallbacks('queue', { duration });
  }

  emit() {
    this.#payout();
    this.#runCallbacks('action');

    this.#inProgress = false;

    if (this.#autonomous) {
      this.queue();
    }
  }

  /** Flips the flag only. When it may start is the owner's call. */
  toggleAutonomy(toggle?: boolean) {
    this.#autonomous = toggle ?? !this.#autonomous;
  }

  get duration() { return this.#duration; }
  get autonomous() { return this.#autonomous; }
  get inProgress() { return this.#inProgress; }

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
