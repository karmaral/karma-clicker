import Building from '$lib/buildings/base.svelte';
import Click from '$lib/buildings/click.svelte';
import Cohort from '$lib/buildings/cohort.svelte';
import { PlanetManager, ResourceManager } from '.';
import { reserve } from '$lib/reserve.svelte';
import { aim } from '$lib/aim';
import data from '$data/buildings';

/** Named in, never excluded out: an unlisted role is a plain building. */
const KINDS: Record<string, typeof Building> = {
  soul: Cohort,
  click: Click,
};

class BuildingManager {
  #buildings: Record<string, Building> = $state({});

  purchase(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const { cost_type } = data[target];
    if (!this.canAfford(target, quantity)) return;

    this.unlock(target);
    const cost = this.#buildings[target].getCost(quantity);
    ResourceManager.remove(cost_type, cost);
    this.acquire(target, quantity);

    return true;
  }

  /**
   * `role` is read here and nowhere else — the class carries it afterwards.
   * Chosen by naming the role, never by excluding another, so a later role
   * nobody has written a class for is a plain building rather than the last
   * branch's leftovers.
   */
  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#buildings)) return;

    const initData = data[target];
    const Kind = KINDS[initData.role ?? 'soul'] ?? Building;

    this.#buildings[target] = new Kind(target, initData);
  }

  /**
   * A cohort starts manual — the clerk is its own purchase now, cohort 1
   * included, so nothing here pins autonomy open on the first copy any more.
   * See `docs/design.md` §5, *Clerks*.
   */
  acquire(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    this.#buildings[target]?.add(quantity);
  }

  #cohorts() {
    return this.buildings
      .map((id) => this.#buildings[id])
      .filter((building): building is Cohort => building instanceof Cohort);
  }

  /**
   * Which of the buildings are cohorts, by id. Named in by class the way `KINDS`
   * names roles in, so the click is out of it without anyone excluding it — which
   * is what lets an `All cohorts` upgrade mean exactly that.
   */
  get cohorts() {
    return this.#cohorts().map((cohort) => cohort.id);
  }

  countSouls() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.count, 0);
  }

  /** Souls held back from incarnating, both jobs. Summed per cohort, matching the rounding. */
  countReserved() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.reserved, 0);
  }

  /** Held for the harness — 0 unless a world is actually being anchored. */
  countAnchoring() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.anchoring, 0);
  }

  /** Held for the refinery. Unlike anchoring, this one holds between worlds. */
  countRefining() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.refining, 0);
  }

  /**
   * What the levers name, ignoring whether the phase is on. Progression reads
   * this rather than `countReserved`: a beat asking whether the player has ever
   * held a soul back must not un-fire when the world it was anchoring finishes.
   */
  countHeldBySplit() {
    return this.#cohorts().reduce((sum, cohort) => sum + reserve.countHeld(cohort.count), 0);
  }

  /**
   * Both polarities together — the scale, not the mix. Summed off the same split
   * the rows show, so the wall and the display cannot disagree about income; that
   * puts aim and the wave phase inside the wall. The click is manual, so it is out.
   */
  countKarmaPerSecond() {
    const { positive, negative } = this.countKarmaPerSecondByPolarity();

    return positive + negative;
  }

  /**
   * Split for the two badges that read it separately — same sum as
   * `countKarmaPerSecond`. A cohort without its clerk earns nothing until sent
   * by hand, so it is out here the same way the click is.
   */
  countKarmaPerSecondByPolarity() {
    return this.#cohorts().filter((cohort) => cohort.isAutonomous).reduce(
      (sum, cohort) => {
        const { positive, negative } = cohort.karmaPerSecond();
        sum.positive += positive;
        sum.negative += negative;

        return sum;
      },
      { positive: 0, negative: 0 },
    );
  }

  /**
   * The same income with the wave taken back out — what a phase-averaged second
   * is worth, rather than what this instant reads. The bias swings the figure ×3
   * across the wave, so anything sizing a *lasting* reward against income has to
   * use this or it pays triple for leaving on a dense phase.
   *
   * The blend is divided back out rather than the income being recomputed from
   * `buildings.ts`, so the two cannot drift apart when either moves. It is the
   * *instant's* blend, though, where a long cohort's own payout already averages
   * across its life — so this over-corrects the slow end of the ladder a little,
   * and the correction shrinks as lives lengthen. Approximate on purpose.
   */
  countKarmaPerSecondAveraged() {
    const planet = PlanetManager.getActive();
    if (!planet) return this.countKarmaPerSecond();

    const { positiveShare } = aim.resolve();
    const blend = (1 - positiveShare) * planet.bias(false) + positiveShare * planet.bias(true);

    return blend > 0 ? this.countKarmaPerSecond() / blend : 0;
  }

  /** Souls only, same exclusion as `countKarmaPerSecond` — the click and any unclerked cohort are manual. */
  countExperiencePerSecond() {
    return this.#cohorts()
      .filter((cohort) => cohort.isAutonomous)
      .reduce((sum, cohort) => sum + cohort.perSecond('experience'), 0);
  }

  /**
   * One fraction taken out of every cohort, proportionally — you never choose
   * which flavour goes (CONTEXT v3 §3.3). Rounding is per cohort, so read the
   * count off `countMergeable` rather than recomputing it from the fraction.
   */
  #takeFromCohorts(mergeFraction: number) {
    const fraction = Math.max(0, Math.min(1, mergeFraction));

    return this.#cohorts()
      .map((cohort) => ({ cohort, count: Math.round(cohort.count * fraction) }))
      .filter(({ count }) => count > 0);
  }

  /** What merging at this fraction would take. The split control reads it. */
  countMergeable(mergeFraction: number) {
    return this.#takeFromCohorts(mergeFraction).reduce((sum, { count }) => sum + count, 0);
  }

  /**
   * The lowest whole percent whose split reaches `minimum` — the floor the merge
   * slider starts at. Searched rather than divided, for the same reason the note
   * above gives: rounding is per cohort, so the fraction arithmetic predicts is
   * not the one that reaches the count. Monotone, so halving is exact. Returns
   * 100 when even all of them fall short, which the first-harvest condition has
   * already caught.
   */
  findMergeFloor(minimum: number) {
    if (minimum <= 0) return 0;

    let low = 0;
    let high = 100;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);

      if (this.countMergeable(mid / 100) >= minimum) high = mid;
      else low = mid + 1;
    }

    return low;
  }

  /**
   * The same floor for a toll authored as a *share* — worlds author shares now,
   * and the bisection still has to happen against counts, because rounding is
   * per cohort. `ceil`, so the split that reaches the count is never a soul short.
   */
  findMergeFloorForShare(share: number) {
    return this.findMergeFloor(Math.ceil(share * this.countSouls()));
  }

  /** Merged souls stop being yours. Returns how many went. */
  mergeSouls(mergeFraction: number) {
    let merged = 0;

    this.#takeFromCohorts(mergeFraction).forEach(({ cohort, count }) => {
      cohort.remove(count);
      merged += count;
    });

    return merged;
  }

  canAfford(target: string, quantity = 1) {
    if (!Boolean(target in data)) return false;
    if (!Boolean(target in this.#buildings)) return false;

    const { cost_type } = data[target];
    const cost = this.#buildings[target].getCost(quantity);

    return ResourceManager.has(cost_type, cost);
  }

  getAffordableQuantity(target: string) {
    if (!Boolean(target in this.#buildings)) return;

    const { cost_type } = data[target];
    let q = 1;
    let cost = this.#buildings[target].getCost(q);

    while (ResourceManager.has(cost_type, cost)) {
      q++;
      cost = this.#buildings[target].getCost(q);
    }

    return q - 1;
  }

  getBuilding(id: string) {
    return this.#buildings[id];
  }

  get buildings() {
    return Object.keys(this.#buildings);
  }

  addListener(target: string, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#buildings[target]?.addListener(listenerType, callback);
  }

  removeListener(target: string, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#buildings[target]?.removeListener(listenerType, callback);
  }
}

const manager = new BuildingManager();
export default manager;
