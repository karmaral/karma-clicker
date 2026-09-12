/**
 * Raising an old save to the current shape. The rule used to be that an older
 * save is refused, not patched — that was cheap while nothing was worth keeping,
 * and a run is now long enough that throwing one away to add a field is the
 * wrong trade.
 *
 * One step per version, each raising a save by exactly one and each responsible
 * only for the fields its own version added. They compose, so a v3 save walks
 * every step between it and `SAVE_VERSION` and arrives whole — no step ever has
 * to know what the shape was two versions ago.
 *
 * **OLDEST_VERSION is the floor.** Below it there is nothing to raise from: a
 * save older than that predates fields nothing can invent a value for, and is
 * refused the way every save used to be.
 */

import { SAVE_VERSION, isSaveState, type SaveState } from './state';

/** The oldest shape a step exists for. Anything below is refused, not guessed at. */
export const OLDEST_VERSION = 3;

/** A save mid-migration: the fields of no particular version. */
type Raw = Record<string, unknown>;

/**
 * v3 → v4. Anchoring became a choice, so a world carries whether its job is
 * open and what its anchors were worth at departure, and the harness carries a
 * bought line count.
 *
 * A v3 world part-way through an anchor had no say in it — the phase was forced.
 * Reading `placedMs` as consent is the only honest restore: the alternative
 * silently abandons work the player has already paid souls for.
 *
 * Every finished v3 world takes `anchorBonus` 1. Its harvest was resolved without
 * one, so 1 is what it has been paying all along, not a concession.
 */
function toFour(state: Raw): Raw {
  const planets = state.planets as Raw | undefined;
  const states = (planets?.states ?? {}) as Record<string, Raw>;

  Object.values(states).forEach((planet) => {
    planet.anchorBonus = 1;
    planet.isAnchorJobActive = Number(planet.placedMs ?? 0) > 0;
  });

  return {
    ...state,
    version: 4,
    harness: { lines: 0, isLinesUnlocked: false },
  };
}

/** Keyed by the version each step raises *from*. */
const STEPS: Record<number, (state: Raw) => Raw> = {
  3: toFour,
};

/**
 * A parsed save at whatever version it was written, brought forward. Returns
 * nothing when it is not a save at all, is older than the floor, or comes out
 * the far end still not matching the current shape — a partial raise is a
 * refusal, not something to hand to `apply`.
 */
export function migrate(parsed: unknown): SaveState | undefined {
  if (!parsed || typeof parsed !== 'object') return;

  let state = { ...parsed } as Raw;
  let version = Number(state.version);
  if (!Number.isFinite(version) || version < OLDEST_VERSION) return;

  while (version < SAVE_VERSION) {
    const step = STEPS[version];
    if (!step) return;

    state = step(state);
    version = Number(state.version);
  }

  return isSaveState(state) ? state : undefined;
}
