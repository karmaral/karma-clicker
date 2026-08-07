import { progression, type RevealKey } from '$lib/progression';
import { PlanetManager } from '$lib/managers';
import { SCREEN_LABELS, type ScreenName } from '$lib/labels';
import planetTexts from '$data/planets-texts';

const NAV_KEY: Record<ScreenName, RevealKey> = {
  overview: 'nav.overview',
  detail: 'nav.detail',
  refinery: 'nav.refinery',
};

let requested = $state<ScreenName>('detail');

function isAvailable(screen: ScreenName) {
  if (screen === 'detail') return Boolean(PlanetManager.getActive());

  return progression.isLive(NAV_KEY[screen]);
}

const active = $derived(isAvailable(requested) ? requested : 'overview');

const detailLabel = $derived(planetTexts[PlanetManager.selected]?.title ?? '—');

export const nav = {
  get active() { return active; },

  state(screen: ScreenName) {
    return progression.reveal(NAV_KEY[screen]);
  },
  isAvailable,
  label(screen: ScreenName) {
    return screen === 'detail' ? detailLabel : SCREEN_LABELS[screen];
  },
  to(screen: ScreenName) {
    if (isAvailable(screen)) {
      requested = screen;
    }
  },
};
