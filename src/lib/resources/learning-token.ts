import { derived } from 'svelte/store';
import PolarizedResource from './polarized';
import type { Polarity, ResourceType, CombinedResourceType } from '$lib/types';
import { getPolarityLabel } from '$lib/utils';

export class LearningToken extends PolarizedResource {
  constructor(type: CombinedResourceType, polarity: Polarity) {
    const t = `${type}_${getPolarityLabel(polarity)}` as ResourceType;
    super(t, polarity);
  }
}

const negRed = new LearningToken('red', -1);
const negYellow = new LearningToken('yellow', -1);
const negBlue = new LearningToken('blue', -1);
const posRed = new LearningToken('red', 1);
const posYellow = new LearningToken('yellow', 1);
const posBlue = new LearningToken('blue', 1);

const combinedRed = derived<LearningToken[], number>([negRed, posRed], ($values, set) => {
  set($values[0].amount + $values[1].amount);
});
const combinedYellow = derived<LearningToken[], number>([negYellow, posYellow], ($values, set) => {
  set($values[0].amount + $values[1].amount);
});
const combinedBlue = derived<LearningToken[], number>([negBlue, posBlue], ($values, set) => {
  set($values[0].amount + $values[1].amount);
});

export { 
  negRed,
  negYellow,
  negBlue,
  posRed,
  posYellow,
  posBlue,
  combinedRed,
  combinedYellow,
  combinedBlue,
};
