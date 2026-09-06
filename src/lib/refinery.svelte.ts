/**
 * Matching, not throughput. One draw serves both lanes and the shorter pile caps
 * it, so a matched pair of karma becomes a matched pair of red and the *unpaired*
 * remainder — the excess — can never leave the karma layer. Polarity still
 * survives the step; what no longer survives it is the imbalance.
 *
 * Capacity is a *saturating share of what is produced*, not a share of what is
 * held — see `docs/design.md` §9. Upgrades push `reach`, uncapped; `coverage`
 * is a view over it that approaches 1.0 and never reaches it, so no worker
 * count or upgrade total can push the refinery past what exists to clear. The
 * backlog always grows, by construction — that is not a bug, it is what keeps
 * the interval free to move for feel without ever starving a thin pile.
 *
 * The level moves a second, independent axis: crimson per karma, not
 * throughput. It starts below 1 — the refinery is lossy at first — and rises
 * as the level does, so it keeps climbing after the upgrade table runs dry
 * without ever feeding back into `reach`.
 *
 * Two different numbers wear the name "rate": `perSecond`/`batch` are a
 * *forecast* — coverage times the current short-pile income, so they move the
 * instant a cohort or the aim dial does. `clearedPerSecond` is *measured* — a
 * trailing window over `#refined`, the same lifetime counter levelling reads —
 * so it moves on a human cadence and only when karma actually changed hands. A
 * HUD reads the second; the lab and DevPanel want the first.
 */

import { ResourceEmitter, type Listener } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, ResourceManager } from '$lib/managers';
import { getShortPileIncome } from '$lib/income';
import { clock } from '$lib/clock';
import balance from '$data/balance';
import type { Modifier, ResourceType } from '$types';

export interface RefinerySnapshot {
  level: number;
  exp: number;
  refined: number;
  produced: number;
}

/** Under this the emitter would re-queue inside its own payout. */
const MIN_INTERVAL = 100;

/** A free rung would let one batch level forever. The lab can dial `expBase` to 0. */
const MIN_RUNG = 1;

/**
 * Display smoothing only — these are cadences, not balance, so they live here
 * rather than in `balance.ts`. A trailing rate needs samples spread wider than
 * one pulse or it just re-derives the forecast it is replacing — and a *fixed*
 * window ripples at the pulse's own period whenever too few pulses fit inside
 * it, which is why the window itself scales with `#interval` below rather than
 * staying constant. `MIN_WINDOW_MS` only matters once the interval is already
 * short enough that even a dozen pulses fit in a couple of seconds.
 */
const SAMPLE_MS = 500;
const MIN_WINDOW_MS = 12_000;
const PULSES_PER_WINDOW = 8;
const HISTORY = 240;

/** Each pile has exactly one destination; nothing crosses over in here. */
const PILES: [ResourceType, ResourceType][] = [
  ['karma_positive', 'red_positive'],
  ['karma_negative', 'red_negative'],
];

class Refinery {
  #modifiers = new ModifierSet();
  #emitter: ResourceEmitter;
  #level = $state(1);
  #exp = $state(0);
  /** Lifetime karma moved — never decremented, unlike `#exp`. Feeds levelling. */
  #refined = $state(0);

  /** Lifetime crimson produced — never decremented. The wisdom base; see `prestige.svelte.ts`. */
  #produced = $state(0);

  /** Per pile, what the last pulse actually drew from karma — 0 until the first one lands. */
  #lastPaired = $state(0);

  /** Per pile, what the last pulse actually paid in crimson — `lastPaired × ratio`. */
  #lastProduced = $state(0);

  /**
   * Timestamped samples of `#refined`, for a *measured* rate rather than the
   * forecast `#batch` is. Ring capped at `HISTORY`; `sample()` throttles itself
   * to `SAMPLE_MS` so any caller may invoke it at any cadence.
   *
   * `.raw`, and it matters: a deep `$state` proxies every element, so the
   * thousands of reads a window walk makes would each register a dependency of
   * their own. `sample()` replaces the array wholesale, which is exactly what
   * raw state wants.
   */
  #samples = $state.raw<{ at: number; refined: number }[]>([]);

  /** A base plus whatever is bought. Reserved souls fill them — neither on its own refines anything. */
  #slots = $derived(this.#modifiers.apply(balance.refinery.slots, 'slots'));

  /**
   * The refining share, capped by the slots. Its own lever, not a remainder: the
   * harness cannot reach these souls and they are never released to it, so a
   * world going down does not quietly stop the refinery.
   */
  #workers = $derived(Math.min(BuildingManager.countRefining(), this.#slots));

  /** What one worker at efficiency x1 is worth — a channel on the same stack as reach upgrades. */
  #efficiency = $derived(this.#modifiers.apply(1, 'yield'));

  /** Bought only — see `docs/design.md` §9. Uncapped; `coverage` is a saturating view over it. */
  #reach = $derived(
    balance.refinery.coveragePerWorker * this.#workers * this.#efficiency,
  );

  /** Crimson per karma. Earned by running, not bought — starts lossy, never capped. */
  #ratio = $derived(
    balance.refinery.ratioBase + (this.#level - 1) / balance.refinery.levelHalving,
  );

  /** Pulse granularity only — capacity × interval cancels the interval back out, so nothing scales it. */
  #interval = $derived(Math.max(MIN_INTERVAL, balance.refinery.interval));

  /** Wide enough to span `PULSES_PER_WINDOW` pulses at the current interval. */
  #rateWindow = $derived(Math.max(MIN_WINDOW_MS, this.#interval * PULSES_PER_WINDOW));

  /** The share of short-pile income the refinery can clear. Approaches 1.0, never reaches it. */
  #coverage = $derived(this.#reach / (1 + this.#reach));

  /** Cohort karma, bias and aim split excluded — see `getShortPileIncome`. */
  #shortPileIncome = $derived(getShortPileIncome());

  /** Karma/s per lane the refinery can clear at the current coverage. */
  #capacity = $derived(this.#coverage * this.#shortPileIncome);

  /** Per pile, per pulse — a forecast, not a cap on what a starved pile can give up. */
  #batch = $derived(this.#capacity * (this.#interval / 1000));

  /**
   * `$derived` rather than a getter that recomputes: a prop is a lazy read in
   * Svelte, so every consumer touching this would otherwise walk the ring again.
   */
  #clearedPerSecond = $derived(this.#rateAt(this.#samples.length - 1));

  constructor() {
    this.#emitter = new ResourceEmitter((pulls) => this.#refine(pulls), () => this.#interval);
  }

  /** The clock runs from the beat on, staffed or not. Idempotent. */
  start() {
    if (this.#emitter.isAutonomous) return;

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
  }

  /**
   * One draw for every lane, capped by the shortest pile — so the surplus in the
   * longest is untouchable by construction, and an empty pile thins smoothly
   * rather than letting the others run on alone.
   *
   * Reports what it moved, so a listener on `action` can tell a pull from a
   * stall. The clock pulses either way; only this says which one it was.
   *
   * `pulls` is how many draws this one covers — over 1 only once the interval is
   * short enough to stream, where the emitter batches the clock. Capacity is
   * flat, not a share of the pile, so `pulls` draws are simply `pulls` batches —
   * still capped by what the shorter pile actually holds.
   *
   * Karma drawn and crimson paid are no longer the same figure — `ratio` sits
   * between them. Exp and `#refined` read the karma side only; feeding them the
   * crimson side would let the level raise `ratio` off its own output.
   */
  #refine(pulls = 1) {
    if (this.#capacity <= 0) return { paired: 0 };

    const drawn = this.#batch * pulls;
    const paired = Math.min(drawn, ...PILES.map(([karma]) => ResourceManager.getAmount(karma)));
    if (paired <= 0) return { paired: 0 };

    const produced = paired * this.#ratio;

    PILES.forEach(([karma, red]) => {
      ResourceManager.remove(karma, paired);
      ResourceManager.add(red, produced);
    });

    this.#refined += paired * PILES.length;
    this.#produced += produced * PILES.length;
    this.#gainExp(paired * PILES.length);
    this.#lastPaired = paired;
    this.#lastProduced = produced;

    return { paired };
  }

  /**
   * Records a sample of lifetime karma refined, throttled to `SAMPLE_MS` so any
   * caller — the live loop, a direct `pulse()`, a fast-forwarded sim — may call
   * it freely. `clearedPerSecond` is a window over this ring.
   */
  sample() {
    const at = clock.now();
    const last = this.#samples.at(-1);
    if (last && at - last.at < SAMPLE_MS) return;

    const samples = [...this.#samples, { at, refined: this.#refined }];
    this.#samples = samples.length > HISTORY ? samples.slice(-HISTORY) : samples;
  }

  /**
   * The measured rate as of sample `index`: how much `#refined` moved since the
   * newest sample at least `#rateWindow` before it. Walked by time, not by
   * count, so a sparse ring (a backgrounded tab, a fast-forwarded sim) still
   * reads the right window instead of a few samples read as if they were
   * adjacent seconds. Short of a full window, falls back to the oldest sample
   * it has — accurate about a second after load, and only smoother from there.
   */
  #rateAt(index: number) {
    const samples = this.#samples;
    const now = samples[index];
    if (!now) return 0;

    const window = this.#rateWindow;
    let from = samples[0];
    for (let i = index; i >= 0; i -= 1) {
      if (now.at - samples[i].at >= window) { from = samples[i]; break; }
    }

    const seconds = Math.max(1, (now.at - from.at) / 1000);

    return (now.refined - from.refined) / seconds;
  }

  /** What the next rung costs. Ascends, so a fat batch can cross more than one. */
  #expForNext(level: number) {
    const rung = balance.refinery.expBase * Math.pow(balance.refinery.expGrowth, level - 1);

    return Math.max(MIN_RUNG, rung);
  }

  /** Karma moved is the only thing that levels it — an empty pull earns nothing. */
  #gainExp(amount: number) {
    if (amount <= 0) return;

    this.#exp += amount;

    while (this.#exp >= this.#expForNext(this.#level)) {
      this.#exp -= this.#expForNext(this.#level);
      this.#level += 1;
    }
  }

  addModifier(modifier: Modifier) {
    if (this.#modifiers.add(modifier)) {
      this.#emitter.retime();
    }
  }

  addListener(identifier: string, fn: Listener) {
    this.#emitter.addListener(identifier, fn);
  }

  removeListener(identifier: string, fn: Listener) {
    this.#emitter.removeListener(identifier, fn);
  }

  /** Nothing here rederives — a save stores all four raw. */
  restore({ level, exp, refined, produced }: RefinerySnapshot) {
    this.#level = level;
    this.#exp = exp;
    this.#refined = refined;
    this.#produced = produced;
  }

  snapshot(): RefinerySnapshot {
    return {
      level: this.#level, exp: this.#exp, refined: this.#refined, produced: this.#produced,
    };
  }

  get slots() { return this.#slots; }
  get workers() { return this.#workers; }
  get batch() { return this.#batch; }
  get interval() { return this.#interval; }
  get level() { return this.#level; }
  get exp() { return this.#exp; }
  get refined() { return this.#refined; }
  get produced() { return this.#produced; }
  get expToNext() { return this.#expForNext(this.#level); }

  /** Crimson per karma. Below 1.0 the refinery is lossy; the log calls out crossing even. */
  get ratio() { return this.#ratio; }

  /** 0–100, matching Building's convention so Meter takes it directly. */
  get levelProgress() { return (this.#exp / this.#expForNext(this.#level)) * 100; }

  /** When the queued batch lands. */
  get nextAt() { return this.#emitter.nextAt; }

  /** Pulsing faster than a pulse reads. See `ResourceEmitter`. */
  get isStreaming() { return this.#emitter.isStreaming; }

  /** The share of short-pile income the refinery can clear. Approaches 1.0, never reaches it. */
  get coverage() { return this.#coverage; }

  /** What coverage is a share of — cohort karma, bias and aim split excluded. */
  get shortPileIncome() { return this.#shortPileIncome; }

  /**
   * Per pile, what the *next* draw would take — a forecast, not a measurement.
   * Jumps with the live pile and the clock, so it is what the balance lab and
   * DevPanel want; a HUD reading wants `clearedPerSecond` instead.
   */
  get perSecond() { return this.#capacity; }

  /**
   * Across both piles, *measured* — karma actually moved over the last
   * `#rateWindow`, not the forecast `perSecond × PILES.length` used to be.
   * Settles at the short pile's income the same way, just without the
   * sawtooth: a forecast collapses the instant a pulse lands and climbs back
   * over the interval, which is real but reads as noise. See `sample`/`#rateAt`.
   */
  get clearedPerSecond() { return this.#clearedPerSecond; }

  /** What the last pulse drew off karma, per pile — 0 before the first one. */
  get lastPaired() { return this.#lastPaired; }

  /** What the last pulse paid in crimson, per pile — `lastPaired × ratio`, 0 before the first one. */
  get lastProduced() { return this.#lastProduced; }
}

export const refinery = new Refinery();
