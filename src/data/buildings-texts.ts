import type { ItemTextData } from '$lib/types';

const data: Record<string, ItemTextData> = {
  'basic': {
    title: 'Impulse',
    description: 'A singular vector of force or perception with zero complex internal structure yet.',
  },
  'steady': {
    title: 'Steady',
    description: 'Takes longer but yields considerably more.',
  },
  'chaos': {
    title: 'Chaos',
    // Was "Explores polarity at random" — drift is gone, and at resistance 1 this
    // cohort is wholly given to the phase instead. Flagging for a copy pass.
    description: 'Wholly given to the world’s density. Swings a full side each phase.',
  },
  'zealot': {
    title: 'Zealot',
    description: 'Extremely narrow into its own polarity bias. Can work out either way.',
  },
  'red_basic': {
    title: 'Red refiner',
    description: 'Produces red learning tokens on its own, karma free.',

  }
};
export default data;
