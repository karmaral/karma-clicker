import { type Readable, writable, readonly } from 'svelte/store';
import type { ResourceType } from '$types';

export default class Resource {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  #type: ResourceType;
  #amount: number = 0;
  #total: number = 0;

  constructor(type: ResourceType) {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;

    this.#listeners = {
      'total': [],
      'change': [],
      'add': [],
      'remove': [],
    }
    this.#type = type;
  }

  add(n: number) {
    if (n < 0) return;
    const amt = Number(n.toFixed(2));
    this.#update((self: typeof this) =>  {
      self.#amount += amt;
      self.#total += amt;
      return self;
    });

    const changeDetail = { amount: this.#amount };
    const totalDetail = { total: this.#total };
    const addDetail = { added: amt };
    this.#runCallbacks('change', changeDetail);
    this.#runCallbacks('total', totalDetail);
    this.#runCallbacks('add', addDetail);
  }
  remove(n: number) {
    if (n < 0) return;
    const amt = Number(n.toFixed(2));
    this.#update((self: typeof this) =>  {
      self.#amount -= amt;
      if (self.#amount < 0) {
        self.#amount = 0;
      }
      return self;
    });
    const changeDetail = { amount: this.#amount };
    const removeDetail = { removed: amt };
    this.#runCallbacks('change', changeDetail);
    this.#runCallbacks('remove', removeDetail);
  }

  get type() { return this.#type; }
  get amount() { return this.#amount; }
  get total() { return this.#total; }

  addListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier].push(fn);
  }
  removeListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier] = this.#listeners[identifier].filter(callback => callback !== fn);
  }
  #runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (identifier in this.#listeners) {
      this.#listeners[identifier].forEach(callback => callback(detail));
    }
  }
}
