import Resource from './base.svelte';
import PolarizedResource from './polarized';
import type { Polarity, ResourceType } from '$lib/types';
import { getPolarityLabel } from '$lib/utils';

/** Refined from karma, which keeps its polarity across the step. */
export class Red extends PolarizedResource {
  constructor(polarity: Polarity) {
    super(`red_${getPolarityLabel(polarity)}` as ResourceType, polarity);
  }
}

/** Bought by pairing the two reds off, so there is no direction left to carry. */
export class NeutralToken extends Resource {}

const negRed = new Red(-1);
const posRed = new Red(1);
const yellow = new NeutralToken('yellow');
const blue = new NeutralToken('blue');

export {
  negRed,
  posRed,
  yellow,
  blue,
};
