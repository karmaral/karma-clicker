/**
 * Matching, not throughput. One draw serves both lanes and the shorter pile caps
 * it, so a matched pair of karma becomes a matched pair of red and the *unpaired*
 * remainder — the excess — can never leave the karma layer. Polarity still
 * survives the step; what no longer survives it is the imbalance.
 *
 * Capacity is a *draw on the stock* — see `docs/design.md` §21, *Karma as
 * weight*. Upgrades push `reach`, uncapped, and each second the refinery takes
 * `reach / drawSeconds` of the shorter pile. Held karma is what slows you now,
 * so the refinery is how you put it down: the matched backlog settles at
 * `settlesAt` seconds, and every purchase lowers it.
 *
 * The level moves a second, independent axis: crimson per karma, not
 * throughput. It starts below 1 — the refinery is lossy at first — and rises
 * as the level does, so it keeps climbing after the upgrade table runs dry
 * without ever feeding back into `reach`.
 *
 * The balancer is a second split of the staffed souls: they move karma from the
 * long pile to the short one, 1 : 1, so the unpaired remainder becomes something
 * the draw can reach — see `docs/design.md` §21, *The balancer*. It stops at a
 * band around the world's gate; the dial finishes.
 *
 * Two different numbers wear the name "rate": `perSecond`/`batch` are a
 * *forecast* — a share of the current short pile, so they move with every
 * payout and every pulse. `clearedPerSecond` is *measured* — a
 * trailing window over `#refined`, the same lifetime counter levelling reads —
 * so it moves on a human cadence and only when karma actually changed hands. A
 * HUD reads the second; the lab and DevPanel want the first.
 */

import { ResourceEmitter, type Listener } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
import { reserve } from '$lib/reserve.svelte';
import { clock } from '$lib/clock';
import balance from '$data/balance';
import type { Modifier, ResourceType } from '$types';

export interface RefinerySnapshot {
  level: number;
  exp: number;
  refined: number;
  produced: number;
  balancing: number;
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

  /**
   * A base plus whatever is bought. Reserved souls fill them — neither on its own
   * refines anything. Floored: a slot is something one soul stands in, so half of
   * one is not staffable and must not read as capacity.
   */
  #slots = $derived(Math.floor(this.#modifiers.apply(balance.refinery.slots, 'slots')));

  /**
   * The refining share, capped by the slots. Its own lever, not a remainder: the
   * harness cannot reach these souls and they are never released to it, so a
   * world going down does not quietly stop the refinery.
   */
  #workers = $derived(Math.min(BuildingManager.countRefining(), this.#slots));

  /** Opened by an upgrade's `unlock` verb, which replays on load — so not saved. */
  #isBalancerUnlocked = $state(false);

  /** The share of the workers balancing rather than drawing. Inert until unlocked. */
  #balancing = $state(0);

  #balancers = $derived(
    this.#isBalancerUnlocked ? Math.round(this.#workers * this.#balancing) : 0,
  );

  /** The workers left drawing — the only ones `reach` reads. */
  #drawers = $derived(this.#workers - this.#balancers);

  /** What one worker at efficiency x1 is worth — a channel on the same stack as reach upgrades. */
  #efficiency = $derived(this.#modifiers.apply(1, 'yield'));

  /**
   * Rungs down *this* lever's ladder. Its own, not the harness's: granularity is
   * a harness upgrade axis now, and a shared reading would have made every
   * anchor purchase quietly buy the refining lever too.
   */
  #precision = $derived(this.#modifiers.apply(0, 'step'));

  /** Bought only, uncapped. The share of the short pile drawn per `drawSeconds`. */
  #reach = $derived(
    balance.refinery.reachPerWorker * this.#drawers * this.#efficiency,
  );

  /** The share of half the gap moved per `drawSeconds` — the draw's shape, so it converges. */
  #balanceReach = $derived(
    balance.refinery.reachPerWorker * this.#balancers * this.#efficiency
      * this.#modifiers.apply(1, 'balance'),
  );

  /**
   * The excess it stops at: a share of the gate of the world you have yet to
   * leave, so the dial finishes. None between worlds — it balances to 0.
   */
  #band = $derived.by(() => {
    const planet = PlanetManager.getActive();
    const gate = planet && !planet.isHarvested ? planet.data.firstHarvest.excessGate : undefined;

    return gate ? balance.refinery.bandFactor * gate : 0;
  });

  /** The long pile, and half of what it holds over the short one. */
  #imbalance = $derived.by(() => {
    const [[long], [short]] = [...PILES].sort(
      ([a], [b]) => ResourceManager.getAmount(b) - ResourceManager.getAmount(a),
    );
    const longAmount = ResourceManager.getAmount(long);
    const shortAmount = ResourceManager.getAmount(short);
    const outside = longAmount - shortAmount - this.#band * (longAmount + shortAmount);

    return {
      long,
      short,
      halfGap: (longAmount - shortAmount) / 2,
      /** What may move before the band stops it. */
      movable: Math.max(0, outside / 2),
    };
  });

  /** Karma/s moved long → short: a share of half the gap, so it converges. 0 inside the band. */
  #balancedPerSecond = $derived(
    this.#imbalance.movable > 0
      ? this.#imbalance.halfGap * this.#balanceReach / balance.refinery.drawSeconds
      : 0,
  );

  /** Crimson per karma. Earned by running, not bought — starts lossy, never capped. */
  #ratio = $derived(
    balance.refinery.ratioBase + (this.#level - 1) / balance.refinery.levelHalving,
  );

  /** Pulse granularity only — capacity × interval cancels the interval back out, so nothing scales it. */
  #interval = $derived(Math.max(MIN_INTERVAL, balance.refinery.interval));

  /** Wide enough to span `PULSES_PER_WINDOW` pulses at the current interval. */
  #rateWindow = $derived(Math.max(MIN_WINDOW_MS, this.#interval * PULSES_PER_WINDOW));

  /** What pairing can reach — the shorter pile. The longer one's surplus is untouchable. */
  #shortPile = $derived(
    Math.min(...PILES.map(([karma]) => ResourceManager.getAmount(karma))),
  );

  /** Karma/s per lane: a share of the short pile, so a staffed refinery settles rather than chases. */
  #capacity = $derived(this.#shortPile * this.#reach / balance.refinery.drawSeconds);

  /** Seconds of income the matched backlog comes to rest at. Infinite while unstaffed. */
  #settlesAt = $derived(
    this.#reach > 0 ? balance.refinery.drawSeconds / this.#reach : Infinity,
  );

  /** Per pile, per pulse — a forecast, not a cap on what a starved pile can give up. */
  #batch = $derived(this.#capacity * (this.#interval / 1000));

  /**
   * `$derived` rather than a getter that recomputes: a prop is a lazy read in
   * Svelte, so every consumer touching this would otherwise walk the ring again.
   */
  #clearedPerSecond = $derived(this.#rateAt(this.#samples.length - 1));

  constructor() {
    this.#emitter = new ResourceEmitter((pulls) => this.#pulse(pulls), () => this.#interval);
  }

  /** Balance first, so what it moves is drawable on the same pulse. */
  #pulse(pulls: number) {
    this.#balance(pulls);

    return this.#refine(pulls);
  }

  /**
   * Long pile to short, 1 : 1 — nothing is destroyed, so it clears no weight
   * itself; it makes the remainder pairable. `incur` on the short side, so a
   * transfer never counts toward a lifetime-gated unlock.
   */
  #balance(pulls: number) {
    const { long, short, movable } = this.#imbalance;
    const moved = Math.min(movable, this.#balancedPerSecond * (this.#interval / 1000) * pulls);
    if (moved <= 0) return;

    ResourceManager.remove(long, moved);
    ResourceManager.incur(short, moved);
  }

  /** Autonomy from the beat on. Whether a cycle is actually running is `tick`'s. */
  start() {
    if (this.#emitter.isAutonomous) return;

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
  }

  /**
   * Staffing, from the loop. An unstaffed refinery has a capacity of 0, so the
   * pulse in flight would pay nothing when it landed — halting it forfeits no
   * work and stops the screen sweeping toward a payout that is not coming.
   *
   * Driven rather than derived: the worker count moves on the split lever, on a
   * purchase and on a merge, and a `$effect` writing the emitter off a rune
   * would be the loop that reads it. `pulse` already ticks the harness the same
   * way.
   */
  tick() {
    if (!this.#emitter.isAutonomous) return;

    if (this.#workers <= 0) {
      this.#emitter.halt();
      return;
    }

    if (!this.#emitter.isInProgress) {
      this.#emitter.queue();
    }
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
   * short enough to stream, where the emitter batches the clock. `pulls` draws
   * are taken as `pulls` batches off the pile as it stood — a linear step of an
   * exponential draw, exact while `reach / drawSeconds` per pulse stays small —
   * and still capped by what the shorter pile actually holds.
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

      // A finer lever leaves the share sitting between slots — put it on the
      // one below rather than let it read a setting it can no longer be set to.
      if (modifier.stat === 'step') {
        reserve.snapTo('refining', this.step);
        // Same snap as `reserve.snapTo` — the balancing split shares the ladder.
        const slots = Math.floor(this.#balancing / this.step + 1e-9);
        this.#balancing = Number((slots * this.step).toFixed(6));
      }
    }
  }

  addListener(identifier: string, fn: Listener) {
    this.#emitter.addListener(identifier, fn);
  }

  removeListener(identifier: string, fn: Listener) {
    this.#emitter.removeListener(identifier, fn);
  }

  /** An upgrade's `unlock` verb lands here. */
  unlockBalancer() {
    this.#isBalancerUnlocked = true;
  }

  setBalancing(share: number) {
    this.#balancing = Math.max(0, Math.min(1, share));
  }

  /** Nothing here rederives — a save stores all five raw. */
  restore({ level, exp, refined, produced, balancing }: RefinerySnapshot) {
    this.#level = level;
    this.#exp = exp;
    this.#refined = refined;
    this.#produced = produced;
    this.#balancing = balancing;
  }

  snapshot(): RefinerySnapshot {
    return {
      level: this.#level,
      exp: this.#exp,
      refined: this.#refined,
      produced: this.#produced,
      balancing: this.#balancing,
    };
  }

  get slots() { return this.#slots; }
  get workers() { return this.#workers; }
  get drawers() { return this.#drawers; }
  get balancers() { return this.#balancers; }
  get balancing() { return this.#balancing; }
  get isBalancerUnlocked() { return this.#isBalancerUnlocked; }

  /** The excess the balancer stops at; 0 between worlds. */
  get band() { return this.#band; }

  /** Karma/s moved long → short — a forecast, like `perSecond`. */
  get balancedPerSecond() { return this.#balancedPerSecond; }

  /** The finest the refining split can be set to. Coarse until upgrades buy it down. */
  get step() {
    const steps = balance.refinery.splitSteps;

    return steps[Math.min(Math.round(this.#precision), steps.length - 1)];
  }
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

  /** Stopped for want of a worker — see `tick`. The clock is not running at all. */
  get isHalted() { return this.#emitter.isHalted; }

  get reach() { return this.#reach; }

  /** The matched backlog, in seconds of income, that the draw comes to rest at. */
  get settlesAt() { return this.#settlesAt; }

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

  /**
   * Crimson per second *per pile*. Both lanes are paid the same figure every
   * pulse, so this is the rate of the pair rather than of either side — which is
   * what a header reading one crimson figure wants.
   *
   * Forecast, not measured, and deliberately the same basis the refinery screen
   * reads: `#capacity` is a share of the short pile, which moves with every
   * payout but smoothly. The sawtooth the class comment
   * warns a HUD about is `#batch`'s — a per-pulse figure that collapses the
   * instant a pulse lands — not this one's. `clearedPerSecond` is the honest
   * measurement, but a trailing window over a lumpy counter reads as a number
   * that will not sit still, and the two settle to the same place anyway.
   *
   * So this is exactly half of what Refining prints, always, by construction.
   */
  get crimsonPerSecond() {
    return this.#capacity * this.#ratio;
  }

  /** What the last pulse drew off karma, per pile — 0 before the first one. */
  get lastPaired() { return this.#lastPaired; }

  /** What the last pulse paid in crimson, per pile — `lastPaired × ratio`, 0 before the first one. */
  get lastProduced() { return this.#lastProduced; }
}

export const refinery = new Refinery();
