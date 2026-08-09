import type { Modifier, ModifierOp, ModifierStat, ResourceType } from '$types';

/** One op against one value, for callers resolving a `snapshot` before it lands. */
export function applyOp(value: number, op: ModifierOp, amount: number) {
  if (op === 'flat' || op === 'final') return value + amount;
  if (op === 'boost') return value * (1 + amount);
  if (op === 'mult') return value * amount;

  return Math.pow(value, amount);
}

/** A removable list of changes, applied over a base the owner still holds. */
export default class ModifierSet {
  #modifiers = $state<Modifier[]>([]);

  add(modifier: Modifier) {
    const clash = this.#modifiers
      .some((mod) => mod.id === modifier.id && mod.target === modifier.target);
    if (clash) return;

    this.#modifiers.push(modifier);
  }

  remove(id: string) {
    this.#modifiers = this.#modifiers.filter((mod) => mod.id !== id);
  }

  has(id: string) {
    return this.#modifiers.some((mod) => mod.id === id);
  }

  /**
   * Every bucket combines order-independently, so removing one lands exactly
   * where it would be had it never applied.
   */
  apply(base: number, stat: ModifierStat, target?: ResourceType) {
    const applicable = this.#modifiers.filter((mod) => this.#applies(mod, stat, target));
    const values = (op: ModifierOp) => applicable
      .filter((mod) => mod.op === op)
      .map((mod) => mod.value);

    const flat = values('flat').reduce((a, b) => a + b, 0);
    const boost = values('boost').reduce((a, b) => a + b, 0);
    const mult = values('mult').reduce((a, b) => a * b, 1);
    const power = values('pow').reduce((a, b) => a * b, 1);
    const final = values('final').reduce((a, b) => a + b, 0);

    return Math.pow((base + flat) * (1 + boost) * mult, power) + final;
  }

  #applies(modifier: Modifier, stat: ModifierStat, target?: ResourceType) {
    if ((modifier.stat ?? 'yield') !== stat) return false;
    if (stat === 'duration') return true;

    const scope = modifier.target ?? 'all';

    return scope === 'all' || scope === target;
  }

  get modifiers() { return this.#modifiers; }
}
