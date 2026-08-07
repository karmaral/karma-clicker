import { Experience } from '$lib/resources/experience';
import type { PlanetData } from '$types';

export default class Planet {
  #id: string;
  #data: PlanetData;
  #experience = new Experience();

  constructor(id: string, initData: PlanetData) {
    this.#id = id;
    this.#data = initData;
  }

  addExperience(amount: number) {
    this.#experience.add(amount);
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get experience() { return this.#experience.amount; }
}
