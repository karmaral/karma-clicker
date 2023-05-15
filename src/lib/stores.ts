import { writable } from 'svelte/store';

export const refineryView = writable(false);

export const acquiredUpgrades = writable({
  main_action: [],
  basic: [],
});


