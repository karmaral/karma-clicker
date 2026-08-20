import { progression, type RevealKey } from '$lib/progression';
import { PlanetManager } from '$lib/managers';
import { SCREEN_LABELS, type ScreenName } from '$lib/labels';

const NAV_KEY: Record<ScreenName, RevealKey> = {
  overview: 'nav.overview',
  detail: 'nav.detail',
  refinery: 'nav.refinery',
};

let requested = $state<ScreenName>('detail');

/** A finished world is not somewhere you can still act — Detail closes with it. */
function isAvailable(screen: ScreenName) {
  if (screen === 'detail') {
    const planet = PlanetManager.getActive();

    return Boolean(planet) && !planet.isHarvested;
  }

  return progression.isLive(NAV_KEY[screen]);
}

const active = $derived(isAvailable(requested) ? requested : 'overview');

export const nav = {
  get active() { return active; },

  state(screen: ScreenName) {
    return progression.reveal(NAV_KEY[screen]);
  },
  isAvailable,
  label(screen: ScreenName) {
    return SCREEN_LABELS[screen];
  },
  to(screen: ScreenName) {
    if (isAvailable(screen)) {
      requested = screen;
    }
  },
};
