import Building from './base.svelte';
import { reserve } from '$lib/reserve.svelte';

/**
 * A building whose count is souls: the only thing that can be reserved or
 * merged. Aim and karma stay on `Building` — the click yields karma too.
 */
export default class Cohort extends Building {
  #reserved = $derived.by(() => reserve.countHeld(this.count));

  /**
   * Reserved souls are still yours. They only stop incarnating — and the share is
   * taken out of any count, so a preview of ten bought into a third held back
   * prices seven and says so.
   */
  activeAt(count: number) { return count - reserve.countHeld(count); }

  get reserved() { return this.#reserved; }
}
