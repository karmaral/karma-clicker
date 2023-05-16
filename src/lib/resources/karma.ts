import { derived } from 'svelte/store';
import PolarizedResource from './polarized';
import type { Polarity, ResourceType } from '$types';
import { getPolarityLabel } from '$lib/utils';

export default class Karma extends PolarizedResource {
  constructor(polarity: Polarity) {
    const type = `karma_${getPolarityLabel(polarity)}` as ResourceType;
    super(type, polarity);
  }
}

const negKarma = new Karma(-1); 
const posKarma = new Karma(1); 

const combinedKarma = derived<Karma[], number>([negKarma, posKarma], ($values, set) => {
  set($values[0].amount + $values[1].amount);
});
export {
  negKarma,
  posKarma,
  combinedKarma,
};

