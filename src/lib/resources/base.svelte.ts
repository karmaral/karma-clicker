import type { ResourceType } from '$types';

type Listener = (detail?: Record<string, unknown>) => void;

export interface ResourceSnapshot {
  amount: number;
  total: number;
}

export default class Resource {
  #type: ResourceType;
  #amount = $state(0);
  #total = $state(0);

  /**
   * Sub-unit residue, signed, so a pile is a whole number without any flow being
   * rounded away. Rounding each movement on its own would silently zero anything
   * finer than a half — the refinery's early pulses draw a tenth of a karma and
   * pay a quarter of that in crimson, and every one of them would land on 0.
   * Here the fraction waits for the rest of itself instead.
   *
   * Not a rune and not saved: it is never read from outside and it is always
   * under one unit, so a run that ends mid-fraction loses nothing anyone counts.
   */
  #carry = 0;

  #listeners: Record<string, Listener[]> = {
    total: [],
    change: [],
    add: [],
    remove: [],
  };

  constructor(type: ResourceType) {
    this.#type = type;
  }

  /**
   * A movement in, a whole number out. The signed remainder stays on `#carry`, so
   * adds and removes finer than a unit net against each other and pay out once
   * they make one between them.
   */
  #settle(n: number) {
    this.#carry += n;
    const whole = Math.trunc(this.#carry);
    this.#carry -= whole;

    return whole;
  }

  add(n: number) {
    const amt = this.#settle(n);
    this.#amount += amt;
    this.#total += amt;

    this.#runCallbacks('change', { amount: this.#amount });
    this.#runCallbacks('total', { total: this.#total });
    this.#runCallbacks('add', { added: amt });
  }

  /**
   * Never past what is held: `#amount` is whole and every caller caps its ask by
   * it, so truncating an amount at or under the pile cannot overdraw it.
   */
  remove(n: number) {
    const amt = -this.#settle(-n);
    this.#amount -= amt;

    this.#runCallbacks('change', { amount: this.#amount });
    this.#runCallbacks('remove', { removed: amt });
  }

  /**
   * A save writes both figures whole and nothing else. Not `add`: that settles
   * the carry, bumps `#total` a second time, and fires four listener buckets —
   * and `#total` is not a function of `#amount`, since `remove` never reduces it.
   *
   * Floored rather than taken raw, because a pile being a whole number is an
   * invariant now and a save written before it was is not. The carry starts at
   * zero either way — what a run ended mid-fraction does not survive it.
   */
  restore({ amount, total }: ResourceSnapshot) {
    this.#amount = Math.floor(amount);
    this.#total = Math.floor(total);
    this.#carry = 0;
  }

  snapshot(): ResourceSnapshot {
    return { amount: this.#amount, total: this.#total };
  }

  get type() { return this.#type; }
  get amount() { return this.#amount; }
  get total() { return this.#total; }

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
