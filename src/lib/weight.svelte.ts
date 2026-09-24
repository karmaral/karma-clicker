/**
 * Held karma is a burden — see `docs/design.md` §21, *Karma as weight*. What you
 * hold slows your cohorts' experience, and the refinery is how you put it down.
 *
 * Read in seconds, never in amounts: `backlog` is both piles over both piles'
 * income, so a strong run carrying little karma reads light whatever its scale.
 * Inert until the refinery is revealed — weight arrives with the tool to shed it.
 *
 * Driven from the loop rather than derived, because between worlds the income is
 * zero and the backlog undefined; the last reading holds instead.
 */

import { progression } from '$lib/progression';
import { getHeldKarma } from '$lib/excess';
import { getHeldKarmaIncome } from '$lib/income';
import balance from '$data/balance';

export interface WeightSnapshot {
  income: number;
  backlog: number;
}

class Weight {
  #income = $state(0);
  #backlog = $state(0);

  #drag = $derived.by(() => {
    if (!progression.runs('refining')) return 1;

    const { backlogHalving, grace } = balance.weight;

    return 1 / (1 + Math.max(0, this.#backlog - grace) / backlogHalving);
  });

  tick() {
    const income = getHeldKarmaIncome();
    if (!(income > 0)) return;

    this.#income = income;
    this.#backlog = getHeldKarma() / income;
  }

  restore({ income, backlog }: WeightSnapshot) {
    this.#income = income;
    this.#backlog = backlog;
  }

  snapshot(): WeightSnapshot {
    return { income: this.#income, backlog: this.#backlog };
  }

  /** Karma per second across both piles, cycle-mean — the last nonzero reading. */
  get income() { return this.#income; }

  /** Seconds of your own income you are carrying. */
  get backlog() { return this.#backlog; }

  /** What cohort and harvest experience is multiplied by. 1 before the refinery. */
  get drag() { return this.#drag; }
}

export const weight = new Weight();
