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

  #listeners: Record<string, Listener[]> = {
    total: [],
    change: [],
    add: [],
    remove: [],
  };

  constructor(type: ResourceType) {
    this.#type = type;
  }

  add(n: number) {
    const amt = Number(n.toFixed(2));
    this.#amount += amt;
    this.#total += amt;

    this.#runCallbacks('change', { amount: this.#amount });
    this.#runCallbacks('total', { total: this.#total });
    this.#runCallbacks('add', { added: amt });
  }

  remove(n: number) {
    const amt = Number(n.toFixed(2));
    this.#amount -= amt;

    this.#runCallbacks('change', { amount: this.#amount });
    this.#runCallbacks('remove', { removed: amt });
  }

  /**
   * A save writes both figures raw. Not `add`: that rounds, bumps `#total` a
   * second time, and fires four listener buckets — and `#total` is not a
   * function of `#amount`, since `remove` never reduces it.
   */
  restore({ amount, total }: ResourceSnapshot) {
    this.#amount = amount;
    this.#total = total;
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
