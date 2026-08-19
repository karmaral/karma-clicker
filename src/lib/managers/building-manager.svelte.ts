import Building from '$lib/buildings/base.svelte';
import Cohort from '$lib/buildings/cohort.svelte';
import { ResourceManager } from '.';
import data from '$data/buildings';

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
   * Chosen by naming souls, never by excluding the click, so a later role that
   * is not souls does not become a cohort by default.
   */
  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#buildings)) return;

    const initData = data[target];
    const Kind = (initData.role ?? 'soul') === 'soul' ? Cohort : Building;

    this.#buildings[target] = new Kind(target, initData);
  }

  acquire(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const building = this.#buildings[target];
    if (!building) return;

    const firstAcquire = building.count === 0;
    building.add(quantity);

    if (firstAcquire && data[target].role !== 'click') {
      building.toggleAutonomy(true);
    }
  }

  #cohorts() {
    return this.buildings
      .map((id) => this.#buildings[id])
      .filter((building): building is Cohort => building instanceof Cohort);
  }

  countSouls() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.count, 0);
  }

  /** Souls held back from incarnating. Summed per cohort, matching the rounding. */
  countReserved() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.reserved, 0);
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

  /** Split for the two badges that read it separately — same sum as `countKarmaPerSecond`. */
  countKarmaPerSecondByPolarity() {
    return this.#cohorts().reduce(
      (sum, cohort) => {
        const { positive, negative } = cohort.karmaPerSecond();
        sum.positive += positive;
        sum.negative += negative;

        return sum;
      },
      { positive: 0, negative: 0 },
    );
  }

  /** Souls only, same exclusion as `countKarmaPerSecond` — the click is manual. */
  countExperiencePerSecond() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.perSecond('experience'), 0);
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
