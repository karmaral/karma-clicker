/**
 * The Overview's picked world. A module rather than screen state so the pick
 * survives the screen being swapped out and comes back as you left it.
 */
import { PlanetManager } from '$lib/managers';

let picked = $state('');

export const selection = {
  get id() { return picked || PlanetManager.selected; },
  pick(id: string) { picked = id; },
};
