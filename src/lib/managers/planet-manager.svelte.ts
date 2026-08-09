import Planet from '$lib/planets/base.svelte';
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

  getPlanet(id: string) {
    return this.#planets[id];
  }

  getActive() {
    return this.#planets[this.#selected];
  }

  get planets() { return Object.keys(this.#planets); }
  get selected() { return this.#selected; }
}

const manager = new PlanetManager();
export default manager;
