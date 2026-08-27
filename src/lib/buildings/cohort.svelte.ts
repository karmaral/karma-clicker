import Building from './base.svelte';
import { PlanetManager } from '$lib/managers';
import { reserve } from '$lib/reserve.svelte';
import { harness } from '$lib/harness.svelte';

/**
 * A building whose count is souls: the only thing that can be reserved or
 * merged. Aim and karma stay on `Building` — the click yields karma too.
 */
export default class Cohort extends Building {
  /**
   * The anchoring share only withholds while a world is going down. The phase
   * gate lives here rather than in `Reserve` because a lever left set between
   * worlds should cost nothing — and because `Reserve` knowing about the harness
   * would close a cycle back through the manager.
   */
  #anchoringAt(count: number) {
    return harness.isPlacing ? reserve.countHeld(count, 'anchoring') : 0;
  }

  #heldAt(count: number) {
    return Math.min(count, this.#anchoringAt(count) + reserve.countHeld(count, 'refining'));
  }

  #anchoring = $derived(this.#anchoringAt(this.count));
  #refining = $derived(reserve.countHeld(this.count, 'refining'));
  #reserved = $derived(this.#heldAt(this.count));

  /**
   * Reserved souls are still yours. They only stop incarnating — and the share is
   * taken out of any count, so a preview of ten bought into a third held back
   * prices seven and says so.
   */
  activeAt(count: number) { return count - this.#heldAt(count); }

  /**
   * What the placed anchors pay — and nothing at all between worlds. A soul
   * incarnates *somewhere*; with the last world harvested and the next not
   * chosen there is nowhere to be born, so the cohorts keep their count and stop
   * earning. Zero rather than a stopped emitter, so the roster and the header
   * read the same figure from `perSecond` and what is left running is the worlds
   * behind you.
   */
  get yieldScale() {
    if (!PlanetManager.getActive()) return 0;

    return harness.multiplierFor(this.active);
  }

  get anchoring() { return this.#anchoring; }
  get refining() { return this.#refining; }
  get reserved() { return this.#reserved; }
}
