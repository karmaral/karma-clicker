import { writable } from 'svelte/store';
import buildingData from '$data/buildings';

export const buildings = writable({
  'basic': {
    quantity: 0,
    level: 0,
    valueYield: 1,
    duration: buildingData.basic.duration,
  }
})

export const acquiredUpgrades = writable({
  main_action: [],
  basic: [],
});


