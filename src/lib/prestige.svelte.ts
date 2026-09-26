/**
 * The end of a run, and the one thing that survives it — see `docs/design.md`
 * §18. Wisdom is the residue a run leaves, `√(produced/W + xp/X)`, earned by
 * ending the run and never bought. Crimson, not karma moved: the refinery's
 * level raises crimson per karma, so reading crimson is what lets that earned
 * axis compound into the outer wheel. Lifetime experience is the second term
 * and the weaker one, so a run that grew wide without refining still banks
 * something; the two sum *inside* the root, which is what keeps one climb and
 * one widening unit rather than two curves laid over each other.
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
   * What one experience is worth in crimson, so both axes can be carried as one
   * figure on the scale the player already reads. `X` units of xp weigh `W`, by
   * construction, which is the whole content of the two constants.
   */
  #xpInCrimson = balance.prestige.firstWisdomAt / balance.prestige.firstWisdomFromXp;

  /**
   * Both axes in crimson terms: `produced + xp·(W/X)`, so `earned/W` is exactly
   * §18's `produced/W + xp/X`. Lifetime experience and not the pile — `total` is
   * never decremented, so buying a cohort cannot cost a run its residue.
   */
  #earned = $derived(
    refinery.produced + ResourceManager.getTotal('experience') * this.#xpInCrimson,
  );

  /**
   * Floored, because the door is `earned >= W` and the payout is `√(earned/W)` —
   * flooring is what keeps the two agreeing. A fractional unit would move the
   * yield by nothing anyone can read.
   */
  #gained = $derived(
    Math.floor(Math.sqrt(this.#earned / balance.prestige.firstWisdomAt)),
  );

  #held = $derived(ResourceManager.getAmount('wisdom'));

  /**
   * The same statement `#gained` makes: `√(earned/W) = 1` exactly when
   * `earned = W`, which is why the constant is named after the door it opens.
   */
  #isOpen = $derived(this.#earned >= balance.prestige.firstWisdomAt);

  #yieldMultiplier = $derived(1 + this.#held * balance.prestige.yieldPerWisdom);

  /**
   * The root read backwards: the nth wisdom lands at `n²·W` crimson, so the
   * step from one unit to the next is `(2n+1)·W` and every unit costs more
   * than the one before it. The curve is the payout's own shape — there is no
   * second table laid over it.
   */
  #crimsonFor(unit: number) {
    return unit * unit * balance.prestige.firstWisdomAt;
  }

  #bandFloor = $derived(this.#crimsonFor(this.#gained));
  #bandCeiling = $derived(this.#crimsonFor(this.#gained + 1));

  /**
   * 0–100 across the current band only, matching `refinery.levelProgress` so
   * `Meter` takes it directly. Linear inside the band on purpose: the band is
   * already wider than the last one, and bowing the track would claim the
   * climb twice.
   */
  #progress = $derived(
    ((this.#earned - this.#bandFloor) / (this.#bandCeiling - this.#bandFloor)) * 100,
  );

  /**
   * Writes the legacy, then reloads. False without reloading if the write
   * failed — a run whose residue could not be stored must not be spent.
   *
   * `kept` is pushed in, not read: `UpgradeManager` reaches `progression`, which
   * imports this.
   */
  end(beat: number, kept: string[]) {
    if (!this.#isOpen) return false;
    if (!setLegacy({ wisdom: this.#held + this.#gained, beat, kept })) return false;

    location.reload();

    return true;
  }

  get gained() { return this.#gained; }
  get held() { return this.#held; }
  get isOpen() { return this.#isOpen; }

  /** Both axes as one crimson-weighted figure — what the root actually reads. */
  get earned() { return this.#earned; }

  /**
   * Still owed on the unit being climbed — the first one, before the door opens.
   * In crimson, but xp closes it too, at `W/X` crimson a point.
   */
  get toNext() { return this.#bandCeiling - this.#earned; }

  /** Banked inside the current band, against `bandWidth`. */
  get banked() { return this.#earned - this.#bandFloor; }
  get bandWidth() { return this.#bandCeiling - this.#bandFloor; }
  get progress() { return this.#progress; }

  /** +2% cohort yield a unit; `Click.yieldScale` spends it at half strength. */
  get yieldMultiplier() { return this.#yieldMultiplier; }
}

export const prestige = new Prestige();
