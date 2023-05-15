import type { ItemTextData } from '$lib/types';

const data: Record<string, ItemTextData> = {
  'basic': {
    title: 'Basic probe',
    description: 'Doesn\'t know much. Doesn\'t do much. Kinda just being.',
  },
  'steady': {
    title: 'Steady probe',
    description: 'Takes longer but yields considerably more.',
  },
  'chaos': {
    title: 'Chaos probe',
    description: 'Explores polarity at random. Can grow out of control quickly.',
  },
  'zealot': {
    title: 'Zealot probe', 
    description: 'Extremely narrow into its own polarity bias. Can work out either way.',
  },
  'red_basic': {
    title: 'Red Refiner probe', 
    description: 'Produces red learning tokens on its own, karma free.',
    
  }
};
export default data;
