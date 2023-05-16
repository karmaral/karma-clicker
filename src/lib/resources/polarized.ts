import Resource from './base';
import type { Polarity, ResourceType } from '$types';
import { getPolarityLabel } from '$lib/utils';

export default class PolarizedResource extends Resource {
  #polarity: Polarity = 1;

  constructor(type: ResourceType, polarity: Polarity) {
    super(type);
    this.#polarity = polarity;
  }

  get polarity() { return this.#polarity; }
  get polarityLabel() { return getPolarityLabel(this.#polarity); }
}
