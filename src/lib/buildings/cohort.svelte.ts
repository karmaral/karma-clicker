import Building from './base.svelte';
import { reserve } from '$lib/reserve.svelte';

/**
 * A building whose count is souls: the only thing that can be reserved or
 * merged. Aim and karma stay on `Building` — the click yields karma too.
 */
export default class Cohort extends Building {
  #reserved = $derived.by(() => reserve.countHeld(this.count));

  /** Reserved souls are still yours. They only stop incarnating. */
  get active() { return this.count - this.#reserved; }

  get reserved() { return this.#reserved; }
}
