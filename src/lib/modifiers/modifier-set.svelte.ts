import type { Modifier, ModifierOp, ModifierStat, YieldType } from '$types';

/** A removable list of changes, applied over a base the owner still holds. */
export default class ModifierSet {
  #modifiers = $state<Modifier[]>([]);

  add(modifier: Modifier) {
    if (this.has(modifier.id)) return;

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
  apply(base: number, stat: ModifierStat, target?: YieldType) {
    const applicable = this.#modifiers.filter((mod) => this.#isApplicable(mod, stat, target));
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

  /**
   * Whether one modifier belongs in one `apply` call. Two questions, in order:
   * does it move the stat being asked for, and — for yields only, which are
   * keyed by resource — does it move this resource. An untargeted modifier is
   * `all`, so it moves every one of them.
   */
  #isApplicable(modifier: Modifier, stat: ModifierStat, target?: YieldType) {
    if ((modifier.stat ?? 'yield') !== stat) return false;
    if (stat !== 'yield') return true;

    const scope = modifier.target ?? 'all';

    return scope === 'all' || scope === target;
  }

  get modifiers() { return this.#modifiers; }
}
