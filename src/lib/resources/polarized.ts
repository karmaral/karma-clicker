import Resource from './base';
import type { Polarity, ResourceType } from '$types';
import { splitResourceString } from '$lib/utils';

export default class PolarizedResource extends Resource {
  #polarity: Polarity = 1;

  constructor(type: ResourceType, polarity: Polarity) {
    super(type);
    this.#polarity = polarity;
  }

  get polarity() { return this.#polarity; }
  get polarityLabel() { return splitResourceString(this.type)[1]; }
  get baseLabel() { return splitResourceString(this.type)[0]; }
}
