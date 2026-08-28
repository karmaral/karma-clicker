import Planet from '$lib/planets/base.svelte';
import { getFirstHarvestAlignment } from '$lib/excess';
import { BuildingManager, UpgradeManager } from '.';
import { clock } from '$lib/clock';
import data from '$data/planets';

class PlanetManager {
  #selected = $state('');
  #planets: Record<string, Planet> = $state({});
  /** Discovery order, kept apart from `#planets` — object key order is not a contract. */
  #order: string[] = $state([]);
  /** Whose deltas the wave is made of. Undefined between worlds, so a gap is free. */
  #lastAt: number | undefined;

  /**
   * Ages the world you are standing on, and only that one. Driven by the loop
   * off `clock`, like the harness, so a simulated run fast-forwards the wave
   * with everything else. Leaving a world drops the mark rather than banking it:
   * the next world's first phase starts when you arrive on it.
   */
  tick() {
    const now = clock.now();
    const planet = this.getActive();

    if (!planet) {
      this.#lastAt = undefined;
      return;
    }

    const elapsed = now - (this.#lastAt ?? now);
    this.#lastAt = now;

    planet.advance(elapsed);
  }

  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#planets)) return;

    this.#planets[target] = new Planet(target, data[target]);
    this.#order.push(target);
  }

  select(id: string) {
    if (!Boolean(id in this.#planets)) return;

    this.#selected = id;
  }

  /** A world is left for good, so an unharvested one cannot be left at all. */
  reach(id: string) {
    if (!this.canReach) return;
    if (!Boolean(id in this.#planets)) return;
    if (this.#planets[id].isHarvested) return;

    this.#selected = id;
  }

  /**
   * The active planet's one-off ending. Returns how many souls were merged.
   * The floor is counted before anything is taken — `mergeSouls` is destructive.
   */
  completeFirstHarvest(mergeFraction: number) {
    const planet = this.getActive();
    if (!planet?.isFirstHarvestReady) return 0;
    if (!planet.isMergeSufficient(BuildingManager.countMergeable(mergeFraction))) return 0;

    // Read first, and nowhere else — §3.9, and it is the reading the screen showed.
    // The order used to be load-bearing: against an income-shaped wall the two
    // lines below cut income twice and an Even screen could lock as a side. Excess
    // is a share of the held piles now, and merging souls does not touch them.
    const alignment = getFirstHarvestAlignment();

    const merged = BuildingManager.mergeSouls(mergeFraction);

    // After the souls go, so the levels the merge drops you below go with them —
    // and only those. What the rebuild costs is the other half of what the slider
    // weighs; see *Levels become purchases*.
    UpgradeManager.releaseUnheld();
    planet.completeFirstHarvest(merged, alignment);
    this.#grantBoons(planet);
    this.#selected = '';

    return merged;
  }

  /**
   * What the world leaves you with. Routed exactly as `UpgradeManager` routes a
   * building-scoped effect, and keyed by the world so two planets granting the
   * same change both land — `ModifierSet` drops a repeat id.
   */
  #grantBoons(planet: Planet) {
    planet.data.boons?.forEach((boon, index) => {
      BuildingManager.getBuilding(boon.target)?.addModifier({
        id: `boon:${planet.id}:${index}`,
        ...boon.effect,
      });
    });
  }

  getPlanet(id: string) {
    return this.#planets[id];
  }

  getActive() {
    return this.#planets[this.#selected];
  }

  get planets() { return this.#order; }
  get selected() { return this.#selected; }

  /** The axis, minus where you are: harvested is behind you, the rest is ahead. */
  get behind() {
    return this.planets.filter((id) => id !== this.#selected && this.#planets[id].isHarvested);
  }

  get ahead() {
    return this.planets.filter((id) => id !== this.#selected && !this.#planets[id].isHarvested);
  }

  /** Nothing is holding you here — the world you left clears itself the instant it's done. */
  get canReach() {
    return !this.#selected;
  }

  /** Planets left for good — the count beats 10 and 12 read. */
  get finished() {
    return Object.values(this.#planets).filter((planet) => planet.isHarvested).length;
  }
}

const manager = new PlanetManager();
export default manager;
