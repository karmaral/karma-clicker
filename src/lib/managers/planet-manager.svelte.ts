import Planet from '$lib/planets/base.svelte';
import { getFirstHarvestPolarity } from '$lib/excess';
import { BuildingManager } from '.';
import data from '$data/planets';

class PlanetManager {
  #selected = $state('');
  #planets: Record<string, Planet> = $state({});

  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#planets)) return;

    this.#planets[target] = new Planet(target, data[target]);
  }

  select(id: string) {
    if (!Boolean(id in this.#planets)) return;

    this.#selected = id;
  }

  /** A world is left for good, so an unharvested one cannot be left at all. */
  reach(id: string) {
    if (!this.canReach) return;
    if (!Boolean(id in this.#planets)) return;
    if (this.#planets[id].harvested) return;

    this.#selected = id;
  }

  /** The active planet's one-off ending. Returns how many souls were merged. */
  completeFirstHarvest(mergeFraction: number) {
    const planet = this.getActive();
    if (!planet?.isFirstHarvestReady) return 0;

    const merged = BuildingManager.mergeSouls(mergeFraction);
    planet.completeFirstHarvest(merged, getFirstHarvestPolarity());

    return merged;
  }

  getPlanet(id: string) {
    return this.#planets[id];
  }

  getActive() {
    return this.#planets[this.#selected];
  }

  get planets() { return Object.keys(this.#planets); }
  get selected() { return this.#selected; }

  /** The axis, minus where you are: harvested is behind you, the rest is ahead. */
  get behind() {
    return this.planets.filter((id) => id !== this.#selected && this.#planets[id].harvested);
  }

  get ahead() {
    return this.planets.filter((id) => id !== this.#selected && !this.#planets[id].harvested);
  }

  get canReach() {
    return this.getActive()?.harvested ?? false;
  }

  /** Planets left for good — the count beats 10 and 12 read. */
  get finished() {
    return Object.values(this.#planets).filter((planet) => planet.harvested).length;
  }
}

const manager = new PlanetManager();
export default manager;
