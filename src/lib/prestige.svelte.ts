/**
 * The end of a run, and the one thing that survives it — see `docs/design.md`
 * §18. Wisdom is the residue of crimson actually produced, `√(produced / W)`,
 * earned by ending the run and never bought. Crimson, not karma moved: the
 * refinery's level raises crimson per karma, so reading crimson is what lets
 * that earned axis compound into the outer wheel.
 *
 * **No `reset()`, and there will not be one.** The law is `save/storage.ts`:
 * every producer schedules itself on a real `setTimeout` and none of them can be
 * cancelled — `clock.after` hands back no handle, and `harness.start`,
 * `refinery.start` and `Building.startEmitter` are one-way. So the module graph
 * is the reset, and a reload is the only way to get one; an in-place wipe would
 * leave orphaned clocks paying into the new run.
 *
 * Imports stay shallow on purpose: `progression` imports *this* for beat 14's
 * trigger, and `save/storage` reaches `progression` through `state.ts`. Either
 * one taken from here would close a real cycle, which is why the legacy lives in
 * its own leaf.
 */

import { ResourceManager } from '$lib/managers';
import { refinery } from '$lib/refinery.svelte';
import { setLegacy } from '$lib/save/legacy';
import balance from '$data/balance';

class Prestige {
  /**
   * Floored, because the door is `produced >= W` and the payout is
   * `√(produced/W)` — flooring is what keeps the two agreeing. A fractional
   * unit would move the yield by nothing anyone can read.
   */
  #gained = $derived(
    Math.floor(Math.sqrt(refinery.produced / balance.prestige.firstWisdomAt)),
  );

  #held = $derived(ResourceManager.getAmount('wisdom'));

  /**
   * The same statement `#gained` makes: `√(produced/W) = 1` exactly when
   * `produced = W`, which is why the constant is named after the door it opens.
   */
  #isOpen = $derived(refinery.produced >= balance.prestige.firstWisdomAt);

  #yieldMultiplier = $derived(1 + this.#held * balance.prestige.yieldPerWisdom);

  /**
   * Writes the legacy, then reloads. False without reloading if the write
   * failed — a run whose residue could not be stored must not be spent.
   */
  end(beat: number) {
    if (!this.#isOpen) return false;
    if (!setLegacy({ wisdom: this.#held + this.#gained, beat })) return false;

    location.reload();

    return true;
  }

  get gained() { return this.#gained; }
  get held() { return this.#held; }
  get isOpen() { return this.#isOpen; }

  /** +2% cohort yield a unit. Spent by `Cohort.yieldScale`, and nowhere else. */
  get yieldMultiplier() { return this.#yieldMultiplier; }
}

export const prestige = new Prestige();
