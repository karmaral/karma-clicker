/**
 * The rig, and the job it does. A world past the first *offers* anchor slots;
 * taking the offer is a choice, and while it is open the split stops being an
 * idle tax and becomes the only lever: reserved souls place the anchors, and the
 * hand helps. The offer is spent when the last anchor lands — buying capacity
 * later re-offers the world rather than reopening the job, so the choice is
 * made once per set of slots and never on your behalf.
 *
 * Progress is denominated in milliseconds of the *job*, never in an abstract
 * work unit — so every figure the panel prints is a time, and a press has a time
 * to name. Souls do not add work; they set how fast job-time runs. That is why
 * dragging the split mid-anchor moves the countdown at once and never the fill.
 *
 * How many of a world's slots you can fill is the rig's answer, not the world's,
 * so every derived figure over the job lives here rather than on `Planet`.
 */

import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
import { clock } from '$lib/clock';
import { readAxes } from '$lib/rig';
import { reserve } from '$lib/reserve.svelte';
import { linesFor } from '$widgets/planet';
import balance from '$data/balance';
import { COHORT_COUNT, cohortId } from '$data/buildings';
import type { Modifier, ResourceType } from '$types';

export interface HarnessSnapshot {
  lines: number;
  isLinesUnlocked: boolean;
}

/** Both piles pay for a line, so neither polarity is the cheap way to buy one. */
const LINE_PILES: ResourceType[] = ['red_positive', 'red_negative'];

/** The cohort a line strings — the ladder, round again once every rung has one. */
export function cohortOfLine(line: number) {
  return cohortId((line % COHORT_COUNT) + 1);
}

class Harness {
  #modifiers = new ModifierSet();
  #isRunning = $state(false);
  #lastAt: number | undefined;

  /**
   * Cohort lines, and whether they can be bought at all. Bought repeatedly at a
   * climbing price rather than granted by a modifier — see `lineCost`. The
   * unlock is an upgrade's `unlock` verb; the lines themselves are a purchase.
   */
  #lines = $state(0);
  #isLinesUnlocked = $state(false);

  /** Every bought capacity at once. The fields below are its readings, named. */
  #axes = $derived(readAxes(this.#modifiers, this.#lines));

  /**
   * A base plus whatever is bought, like the refinery's. Reserved souls fill
   * them; the rest sit idle. Floored for the same reason the riders are — a slot
   * is something one soul stands in.
   */
  #slots = $derived(Math.floor(this.#axes.slots));

  /**
   * What the finished harness carries, a base plus whatever is bought. Only
   * carried souls get the anchor bonus. Floored, because a rider is a soul: a
   * capacity of 200.4 carries two hundred of them and no fraction of another.
   */
  #riders = $derived(Math.floor(this.#axes.riders));

  /** How many of a world's slots the rig can fill. The world's own ceiling caps it. */
  #anchors = $derived(this.#axes.anchors);

  /** Job-ms one worker places per real ms. The efficiency axis. */
  #perWorker = $derived(this.#axes.perWorker);

  /** What one press pays into the job, in ms. */
  #pressMs = $derived(this.#axes.clickMs);

  /** The world's offer, capped by what the rig can fill. 0 on a world with no slots. */
  #anchorsAsked = $derived.by(() => {
    const slots = PlanetManager.getActive()?.anchorSlots ?? 0;

    return Math.max(0, Math.min(Math.round(this.#anchors), slots));
  });

  /**
   * Lines this world holds: one per family of the figure its anchors make. The
   * world's offer, not the rig's capacity — a family is never shared, so lines
   * bought on a larger world wait unstrung on a smaller one.
   */
  #lineCapacity = $derived(linesFor(this.#anchorsAsked));

  /** The bought lines this world can string. */
  #strung = $derived(Math.max(0, Math.min(Math.round(this.#lines), this.#lineCapacity)));

  /**
   * Line `k` strings cohort `k mod COHORT_COUNT`: once the whole ladder has one,
   * the next goes back to the bottom, and every line a cohort holds adds its
   * anchor bonus again. Kept to cohorts the roster has — filtered *in*.
   */
  #lineCohorts = $derived.by(() => {
    const roster = BuildingManager.cohorts;

    return Array.from({ length: this.#strung }, (unused, line) => cohortOfLine(line))
      .filter((id) => roster.includes(id));
  });

  /** The roster row of each, which is the band the swarm draws it as. */
  #lineBands = $derived(this.#lineCohorts.map((id) => BuildingManager.cohorts.indexOf(id)));

  /** Lines per cohort — the bonus's multiple. */
  #linesHeld = $derived.by(() => {
    const held = new Map<string, number>();

    this.#lineCohorts.forEach((id) => held.set(id, (held.get(id) ?? 0) + 1));

    return held;
  });

  /** The cohorts the rig can carry, in roster order. */
  #linedCohorts = $derived(BuildingManager.cohorts.filter((id) => this.#linesHeld.has(id)));

  /** What the lined cohorts have out. The denominator every rider share is taken over. */
  #linedActive = $derived.by(() => {
    return this.#linedCohorts.reduce((sum, id) => {
      return sum + (BuildingManager.getBuilding(id)?.active ?? 0);
    }, 0);
  });

  /**
   * Places on the rig that a soul could actually take: the cap is bought and what
   * fills it is whoever is incarnating *on a line*, so it is the smaller of the
   * two. Whole by construction — both sides of the `min` already are.
   */
  #seats = $derived(Math.max(0, Math.min(this.#riders, this.#linedActive)));

  /**
   * Souls actually on the lines — the seats, and nothing at all until an anchor
   * is down, because an unbuilt harness carries no one.
   *
   * A count and nothing more. What a rider is *worth* is held by whoever the
   * bonus belongs to — see `Click`.
   */
  #riding = $derived(this.anchorsPlaced ? this.#seats : 0);

  /**
   * The seats, dealt out to the lines as whole souls: proportional to what each
   * cohort has out, then the leftovers go to the largest fractions. The parts sum
   * to exactly `#seats` at every split, which rounding each share on its own
   * would not — four cohorts at 2.5 apiece would carry two more souls than the
   * harness was ever bought to hold.
   *
   * One table rather than a sum done per caller, because the deal only balances
   * when every line is dealt at once.
   */
  #ridersByLine = $derived.by(() => {
    const dealt = new Map<string, number>();
    if (this.#seats <= 0 || this.#linedActive <= 0) return dealt;

    const lines = this.#linedCohorts.map((id) => {
      const active = BuildingManager.getBuilding(id)?.active ?? 0;
      const exact = (this.#seats * active) / this.#linedActive;

      dealt.set(id, Math.floor(exact));

      return { id, fraction: exact - Math.floor(exact) };
    });

    const left = this.#seats - [...dealt.values()].reduce((sum, n) => sum + n, 0);

    lines
      .sort((a, b) => b.fraction - a.fraction)
      .slice(0, Math.max(0, left))
      .forEach(({ id }) => dealt.set(id, dealt.get(id)! + 1));

    return dealt;
  });

  /** The whole job, in ms — what `place` clamps against. */
  #anchorJob = $derived(this.#anchorsAsked * (PlanetManager.getActive()?.anchorDuration ?? 0));

  #anchorsPlaced = $derived.by(() => {
    const planet = PlanetManager.getActive();
    if (!planet?.anchorDuration) return 0;

    return Math.min(this.#anchorsAsked, Math.floor(planet.placedMs / planet.anchorDuration));
  });

  /**
   * Of those, the ones a closed job paid for. A cancel keeps them, so the two
   * readings are what the confirm has to be able to tell apart.
   */
  #anchorsBanked = $derived.by(() => {
    const planet = PlanetManager.getActive();
    if (!planet?.anchorDuration) return 0;

    return Math.min(this.#anchorsAsked, Math.floor(planet.bankedMs / planet.anchorDuration));
  });

  /** One flag per slot the rig is filling — what `Anchors` draws. */
  #anchored = $derived.by(() => {
    return Array.from({ length: this.#anchorsAsked }, (unused, i) => i < this.#anchorsPlaced);
  });

  /**
   * Running, on a world whose offer you took, and with slots still to fill. The
   * one condition anything asking "is the job on" should read — the press pays
   * into the job under it, the hand's yields are suspended under it, and the
   * souls are held by it.
   */
  #isPlacing = $derived.by(() => {
    if (!this.#isRunning) return false;

    const planet = PlanetManager.getActive();

    return Boolean(planet?.isAnchorJobActive) && this.#anchorsPlaced < this.#anchorsAsked;
  });

  /**
   * The anchoring share, capped by the slots. `countAnchoring` is already zero
   * off-job, so the lever and the job are asked once, in one place — and the
   * refinery's share is not reachable from here at all.
   */
  #workers = $derived(Math.min(BuildingManager.countAnchoring(), this.#slots));

  /** Job-ms placed per real ms. At 5, a ten-minute anchor lands in two. */
  #speed = $derived(this.#workers * this.#perWorker);

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

    // Read before the clock moves, so a job finished last session closes on the
    // first tick rather than waiting for something to place. Capacity bought
    // afterwards re-offers the world; it never resumes it.
    if (this.isAnchored) {
      PlanetManager.getActive()?.closeAnchorJob();
    }

    const now = clock.now();
    const elapsed = now - (this.#lastAt ?? now);
    this.#lastAt = now;
    if (elapsed <= 0 || this.#speed <= 0) return;

    PlanetManager.getActive()?.place(this.#speed * elapsed, this.#anchorJob);
  }

  /**
   * A press pays into the job directly rather than into the rate, so a world can
   * be clicked open at zero staffing. The same press is a smaller dent in the
   * countdown once souls are on it, which is the shape the lever wants.
   */
  placeByHand() {
    if (!this.#isPlacing) return;

    PlanetManager.getActive()?.place(this.#pressMs, this.#anchorJob);
  }

  /** Taking the world's offer, and giving it back. Both forward to the world. */
  beginJob() {
    PlanetManager.getActive()?.beginAnchorJob();
  }

  cancelJob() {
    PlanetManager.getActive()?.cancelAnchorJob();
  }

  /**
   * The aggregate form of "only riders get the bonus": the covered share scales
   * it. One scalar rather than two soul populations, so a cohort's payout stays
   * a single multiply and the cap stays honest at every count.
   *
   * Asked per cohort, because a line is per cohort — an unlined one rides
   * nothing and is paid nothing extra, however many anchors are down. A cohort
   * holding a second line, once the ladder has gone round, is paid it twice.
   */
  multiplierFor(id: string, souls: number) {
    if (souls <= 0 || !this.#anchorsPlaced) return 1;

    const held = this.#linesHeld.get(id) ?? 0;
    if (!held) return 1;

    const covered = Math.min(this.ridersFor(id, souls), souls) / souls;
    const bonus = PlanetManager.getActive()?.anchorBonus ?? 0;

    return 1 + bonus * this.#anchorsPlaced * covered * held;
  }

  /**
   * How many of one cohort's souls the rig carries — a whole number of souls,
   * read off the deal above rather than recomputed here, so no two callers can
   * apportion the same cap differently.
   *
   * `souls` clamps the answer without re-cutting the deal: the split is taken
   * over what the lines have out now, and a projection asking about a smaller
   * count gets the smaller count.
   */
  ridersFor(id: string, souls: number) {
    if (souls <= 0) return 0;

    return Math.min(Math.floor(souls), this.#ridersByLine.get(id) ?? 0);
  }

  /** An upgrade's `unlock` verb lands here — the lines are bought after it, not by it. */
  unlockLines() {
    this.#isLinesUnlocked = true;
  }

  /**
   * Cumulative over the counter, the same shape `tokens.inversionCost` uses and
   * deliberately its own loop: that curve prices a confession and this one
   * prices capacity, and they are allowed to diverge. Per pile — both pay. Each
   * step rounded before it is added, like both of those.
   */
  lineCost(n = 1) {
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += Math.round(balance.harness.lineBase * balance.harness.lineGrowth ** (this.#lines + i));
    }

    return sum;
  }

  canPurchaseLine(n = 1) {
    if (!this.#isLinesUnlocked || n < 1) return false;
    if (!this.#hasRoomFor(n)) return false;

    const cost = this.lineCost(n);

    return LINE_PILES.every((pile) => ResourceManager.getAmount(pile) >= cost);
  }

  /** Both piles pay, so a partial purchase is not a thing — pairing is the point. */
  purchaseLine(n = 1) {
    if (!this.canPurchaseLine(n)) return;

    const cost = this.lineCost(n);

    LINE_PILES.forEach((pile) => ResourceManager.remove(pile, cost));
    this.#lines += n;

    return true;
  }

  /**
   * Whether the next `n` lines fit: the world has a family for each, and each
   * strings a cohort the roster already has.
   */
  #hasRoomFor(n: number) {
    if (this.#lines + n > this.#lineCapacity) return false;

    const roster = BuildingManager.cohorts;

    for (let i = 0; i < n; i++) {
      if (!roster.includes(cohortOfLine(this.#lines + i))) return false;
    }

    return true;
  }

  /**
   * How many the shorter pile can pay for, one at a time — the curve is
   * geometric — and the world has room for.
   */
  getMaxLines() {
    const held = Math.min(...LINE_PILES.map((pile) => ResourceManager.getAmount(pile)));
    let n = 0;

    while (this.#hasRoomFor(n + 1) && this.lineCost(n + 1) <= held) n++;

    return n;
  }

  addModifier(modifier: Modifier) {
    this.#modifiers.add(modifier);

    // A finer lever leaves the share sitting between slots — put it on the one
    // below rather than let it read a setting it can no longer be set to.
    if (modifier.stat === 'step') {
      reserve.snapTo('anchoring', this.step);
    }
  }

  /** The lines are bought, so nothing rederives them — a save stores both raw. */
  restore({ lines, isLinesUnlocked }: HarnessSnapshot) {
    this.#lines = lines;
    this.#isLinesUnlocked = isLinesUnlocked;
  }

  snapshot(): HarnessSnapshot {
    return { lines: this.#lines, isLinesUnlocked: this.#isLinesUnlocked };
  }

  get slots() { return this.#slots; }
  get riders() { return this.#riders; }
  get riding() { return this.#riding; }
  get workers() { return this.#workers; }
  get speed() { return this.#speed; }
  get perWorker() { return this.#perWorker; }
  get isRunning() { return this.#isRunning; }
  get isPlacing() { return this.#isPlacing; }
  get clickMs() { return this.#pressMs; }

  get lines() { return this.#lines; }
  get lineCapacity() { return this.#lineCapacity; }
  /** Bought lines this world strings — `lines` capped by its families. */
  get strung() { return this.#strung; }
  get linedCohorts() { return this.#linedCohorts; }

  /** The roster row each strung line carries, in purchase order — what the swarm rides. */
  get lineBands() { return this.#lineBands; }

  /** How many lines a cohort holds — its anchor bonus's multiple. */
  linesHeldBy(id: string) { return this.#linesHeld.get(id) ?? 0; }
  get isLinesUnlocked() { return this.#isLinesUnlocked; }

  /** How many the rig can fill, before a world caps it. What the upgrades move. */
  get anchorCapacity() { return Math.round(this.#anchors); }

  /**
   * The job's readout, all of it in job-ms. `anchorRemaining` is what is left of
   * the one in progress; dividing it by `speed` is the countdown.
   */
  get anchorsAsked() { return this.#anchorsAsked; }
  get anchorsPlaced() { return this.#anchorsPlaced; }
  get anchored() { return this.#anchored; }

  /** Anchors a cancel would keep, and the ones it would pull. */
  get anchorsBanked() { return this.#anchorsBanked; }
  get anchorsAtRisk() { return Math.max(0, this.#anchorsPlaced - this.#anchorsBanked); }

  /** How far into the one being placed, 0…1. Full once the last one is in. */
  get anchorFill() {
    const planet = PlanetManager.getActive();
    if (!planet?.anchorDuration) return 1;
    if (planet.placedMs >= this.#anchorJob) return 1;

    return (planet.placedMs % planet.anchorDuration) / planet.anchorDuration;
  }

  get anchorRemaining() {
    return (PlanetManager.getActive()?.anchorDuration ?? 0) * (1 - this.anchorFill);
  }

  /** A world with no slots is never anchorable, and never anchored. */
  get isAnchorable() {
    const planet = PlanetManager.getActive();

    return Boolean(planet) && !planet.isHarvested && this.#anchorsAsked > 0;
  }

  get isAnchored() { return this.#anchorsAsked > 0 && this.#anchorsPlaced >= this.#anchorsAsked; }

  /**
   * What leaving now would lock in. Nominal, with no coverage cut: the anchors
   * stay on the world and the riders leave with you, so what the finished
   * harvest is worth is the anchors alone.
   */
  get harvestBonus() {
    const bonus = PlanetManager.getActive()?.anchorBonus ?? 0;

    return 1 + bonus * this.#anchorsPlaced;
  }

  /** The finest the split can be set to. Coarse until the upgrades buy it down. */
  get step() { return this.#axes.step; }

  /** Everything bought, for whoever draws it rather than reads it. */
  get axes() { return this.#axes; }
}

export const harness = new Harness();
