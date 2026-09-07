import { progression, type RevealKey } from '$lib/progression';
import { PlanetManager } from '$lib/managers';
import { SCREEN_LABELS, type ScreenName } from '$lib/labels';

const NAV_KEY: Record<ScreenName, RevealKey> = {
  overview: 'nav.overview',
  details: 'nav.details',
  refinery: 'nav.refinery',
};

let requested = $state<ScreenName>('details');

/** A finished world is not somewhere you can still act — Detail closes with it. */
function isAvailable(screen: ScreenName) {
  if (screen === 'details') {
    const planet = PlanetManager.getActive();

    return Boolean(planet) && !planet.isHarvested;
  }

  return progression.isLive(NAV_KEY[screen]);
}

const active = $derived(isAvailable(requested) ? requested : 'overview');

/**
 * The first harvest is a **takeover**, not a fourth tab — but of the screen it
 * is reached from rather than of the frame. The navbar stays, so the tab above
 * it stays lit and there is a way back out; a screen with nothing lit over it
 * is a room with no door, which is also why it is not a tab of its own.
 *
 * It lives here rather than in the Overview because **which screen hosts it is
 * not settled** — Overview holds it today, Details is the live alternative, and
 * a flag on `nav` is the one place either can read.
 *
 * Asked for by a verb, and derived rather than stored outright so it closes
 * itself: the moment the world stops being one you could leave, there is
 * nothing to decide and the screen under it comes back.
 */
let asked = $state(false);

const isHarvesting = $derived.by(() => {
  if (!asked || !progression.isRevealed('harvest.screen')) return false;

  const planet = PlanetManager.getActive();

  return Boolean(planet) && !planet.isHarvested;
});

/**
 * The end of the run, taking the same screen the same way and for the same
 * reasons — see `asked` above.
 *
 * **It does not close itself**, and must not be commented as if it did:
 * `isHarvesting` falls away because `planet.isHarvested` flips under it, where
 * `refinery.produced` never falls, so this condition only ever becomes true. What
 * the derived buys is the reveal: a dev rewind past beat 14 takes the screen
 * down with it.
 */
let askedPrestige = $state(false);

const isPrestiging = $derived(askedPrestige && progression.isRevealed('prestige.screen'));

export const nav = {
  get active() { return active; },
  get isHarvesting() { return isHarvesting; },
  get isPrestiging() { return isPrestiging; },
  /** Either takeover: the one condition that hides the rail and the verb row. */
  get isTakeover() { return isHarvesting || isPrestiging; },

  openHarvest() { asked = true; },
  closeHarvest() { asked = false; },

  openPrestige() { askedPrestige = true; },
  closePrestige() { askedPrestige = false; },

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
