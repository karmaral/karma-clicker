/**
 * The anchoring phase. A world past the first will not let its souls incarnate
 * until the harness is down, so the split stops being an idle tax and becomes
 * the only lever: reserved souls place the anchors, and the hand helps.
 *
 * Progress is denominated in milliseconds of the *job*, never in an abstract
 * work unit — so every figure the panel prints is a time, and a press has a time
 * to name. Souls do not add work; they set how fast job-time runs. That is why
 * dragging the split mid-anchor moves the countdown at once and never the fill.
 */

import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, PlanetManager } from '$lib/managers';
import { clock } from '$lib/clock';
import balance from '$data/balance';
import type { Modifier } from '$types';

class Harness {
  #modifiers = new ModifierSet();
  #isRunning = $state(false);
  #lastAt: number | undefined;

  /** Bought, like the refinery's. Reserved souls fill them; the rest sit idle. */
  #slots = $derived(this.#modifiers.apply(balance.harness.slots, 'slots'));

  /** What the finished harness carries. Only carried souls get the anchor bonus. */
  #riders = $derived(this.#modifiers.apply(balance.harness.riders, 'riders'));

  /** Rungs down the split ladder, not a fraction — see `ModifierStat`. */
  #precision = $derived(this.#modifiers.apply(0, 'step'));

  /**
   * Running *and* with a world that still wants anchors. The one condition
   * anything asking "is the phase on" should read — the press pays into the job
   * under it, the hand's yields are suspended under it, and the souls are held
   * by it.
   */
  #isPlacing = $derived(
    this.#isRunning && (PlanetManager.getActive()?.isAnchoring ?? false),
  );

  /**
   * The anchoring share, capped by the slots. `countAnchoring` is already zero
   * off-phase, so the lever and the phase are asked once, in one place — and the
   * refinery's share is not reachable from here at all.
   */
  #workers = $derived(Math.min(BuildingManager.countAnchoring(), this.#slots));

  /** Job-ms placed per real ms. At 5, a ten-minute anchor lands in two. */
  #speed = $derived(this.#workers * this.#modifiers.apply(balance.harness.perWorker, 'yield'));

  /** The clock runs from the beat on, staffed or not. Idempotent. */
  start() {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#lastAt = clock.now();
  }

  /**
   * Driven by the loop off `clock`, so a simulated run fast-forwards with it.
   * Unclamped on purpose: a continuous fill that skipped the time a backgrounded
   * tab spent away would owe the player work it already charged them for.
   */
  tick() {
    if (!this.#isRunning) return;

    const now = clock.now();
    const elapsed = now - (this.#lastAt ?? now);
    this.#lastAt = now;
    if (elapsed <= 0 || this.#speed <= 0) return;

    PlanetManager.getActive()?.place(this.#speed * elapsed);
  }

  /**
   * A press pays into the job directly rather than into the rate, so a world can
   * be clicked open at zero staffing. The same press is a smaller dent in the
   * countdown once souls are on it, which is the shape the lever wants.
   */
  placeByHand() {
    if (!this.#isPlacing) return;

    PlanetManager.getActive()?.place(balance.harness.clickMs);
  }

  /**
   * The aggregate form of "only riders get the bonus": the covered share scales
   * it. One scalar rather than two soul populations, so a cohort's payout stays
   * a single multiply and the cap stays honest at every count.
   */
  multiplierFor(souls: number) {
    if (souls <= 0) return 1;

    const planet = PlanetManager.getActive();
    if (!planet?.anchorsPlaced) return 1;

    const covered = Math.min(this.#riders, souls) / souls;

    return 1 + planet.anchorBonus * planet.anchorsPlaced * covered;
  }

  addModifier(modifier: Modifier) {
    this.#modifiers.add(modifier);
  }

  get slots() { return this.#slots; }
  get riders() { return this.#riders; }
  get workers() { return this.#workers; }
  get speed() { return this.#speed; }
  get isRunning() { return this.#isRunning; }
  get isPlacing() { return this.#isPlacing; }
  get clickMs() { return balance.harness.clickMs; }

  /** The finest the split can be set to. Coarse until the upgrades buy it down. */
  get step() {
    const steps = balance.harness.splitSteps;

    return steps[Math.min(Math.round(this.#precision), steps.length - 1)];
  }
}

export const harness = new Harness();
