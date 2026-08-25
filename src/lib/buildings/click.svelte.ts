import Building from './base.svelte';
import { harness } from '$lib/harness.svelte';

/**
 * The hand. One verb with one payoff at a time: while a world is still being
 * anchored the press buys job-time and nothing else, so the trade the phase
 * imposes is legible rather than a click that quietly does two things.
 *
 * Zero rather than a branch at the call site — the yield still runs, so the
 * spark, the sweep and the cooldown are the same press they always were.
 */
export default class Click extends Building {
  get yieldScale() { return harness.isPlacing ? 0 : 1; }
}
