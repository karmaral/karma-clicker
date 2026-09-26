/**
 * The split that learns — see `docs/design.md` §18. A share of experience income
 * is diverted into knowledge, and each knowledge costs `P·(1 + 2K)` experience at
 * `K` held. Held, not bought: spending restores the rate.
 *
 * A leaf on purpose: both experience write sites call `divert`, so importing
 * `progression` from here would close a cycle through the buildings. A share of
 * 0 diverts nothing, and the only lever that moves it sits behind the reveal.
 */

import ResourceManager from '$lib/managers/resource-manager';
import balance from '$data/balance';

const { price: P, step: STEP } = balance.knowledge;

export interface KnowledgeSnapshot {
  share: number;
}

class Knowledge {
  #share = $state(0);

  #held = $derived(ResourceManager.getAmount('knowledge'));

  setShare(share: number) {
    this.#share = Math.max(0, Math.min(1, share));
  }

  /**
   * Called after the whole of `xp` has landed, so lifetime experience still
   * counts it — the diverted share was earned, then spent. The price integrated
   * rather than sampled, `K + K² = spent/P`, so ten small ticks buy what one large
   * one does — to within the sub-unit carry the pile holds back.
   */
  divert(xp: number) {
    if (this.#share <= 0 || xp <= 0) return;

    const diverted = xp * this.#share;
    const held = ResourceManager.getAmount('knowledge');
    const reached = (-1 + Math.sqrt((1 + 2 * held) ** 2 + (4 * diverted) / P)) / 2;

    ResourceManager.remove('experience', diverted);
    ResourceManager.add('knowledge', reached - held);
  }

  /** Knowledge a second at an income of `xpPerSecond`, at the price you face now. */
  rateFor(xpPerSecond: number) {
    return (xpPerSecond * this.#share) / this.price;
  }

  restore({ share }: KnowledgeSnapshot) {
    this.#share = share;
  }

  snapshot(): KnowledgeSnapshot {
    return { share: this.#share };
  }

  get share() { return this.#share; }
  get step() { return STEP; }

  /** What income is left to grow on. */
  get kept() { return 1 - this.#share; }

  /** Experience for the next knowledge, at what you hold. */
  get price() { return P * (1 + 2 * this.#held); }
}

export const knowledge = new Knowledge();
