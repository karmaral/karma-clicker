import Building from './base.svelte';
import { harness } from '$lib/harness.svelte';
import { prestige } from '$lib/prestige.svelte';

/**
 * The hand. One verb with one payoff at a time: while a world is still being
 * anchored the press buys job-time and nothing else, so the trade the phase
 * imposes is legible rather than a click that quietly does two things.
 *
 * Zero rather than a branch at the call site — the yield still runs, so the
 * spark, the sweep and the cooldown are the same press they always were.
 *
 * Off-phase the same harness pays the hand instead of taking from it: the press
 * scales with the souls riding the finished lines, so the thing you do by hand
 * keeps up with the population rather than being outgrown by it.
 */
export default class Click extends Building {
  /**
   * What one soul riding the harness is worth to the press. Held here and not on
   * the harness: the upgrade changes *you*, and the harness only says how many
   * are up there. Bought — 0 until it is.
   */
  #carry = $derived(this.modify(0, 'carry'));

  get yieldScale() {
    if (harness.isPlacing) return 0;

    /** Half-strength here — the hand rides wisdom less than a cohort does. */
    const wisdom = 1 + (prestige.yieldMultiplier - 1) * 0.5;

    return (1 + this.#carry * harness.riding) * wisdom;
  }
}
