import { writable } from 'svelte/store';
import entityData from '$data/entities';

export const entities = writable({
  'basic': {
    quantity: 0,
    level: 0,
    valueYield: 1,
    duration: entityData.basic.duration,
  }
})

export const acquiredUpgrades = writable({
  main_action: [],
  basic: [],
});


