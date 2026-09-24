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
import balance from '$data/balance';

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

/**
 * v4 → v5. Re-aiming is priced by how far the dial moved, so the aim carries
 * what its last commit bought rather than reading one constant for every move.
 *
 * A v4 save took the flat figure, so that is what it is still owed — the unit,
 * which is also what the shortest move costs now.
 */
function toFive(state: Raw): Raw {
  const aim = (state.aim ?? {}) as Raw;

  return {
    ...state,
    version: 5,
    aim: { ...aim, reaimSpan: balance.aim.reaimPhases },
  };
}

/**
 * v5 → v6. A world pays for the pole it wants, read off a running share of the
 * karma earned on it.
 *
 * Nothing can invent that share for a save written before it was counted, and a
 * guess would either hand a finished world a bonus it never earned or dock one
 * it might have. Both tallies start at zero, which reads as the neutral share,
 * and every v5 world — finished or still being stood on — takes `demandBonus` 1.
 */
function toSix(state: Raw): Raw {
  const planets = state.planets as Raw | undefined;
  const states = (planets?.states ?? {}) as Record<string, Raw>;

  Object.values(states).forEach((planet) => {
    planet.demandedKarma = 0;
    planet.earnedKarma = 0;
    planet.demandBonus = 1;
  });

  return { ...state, version: 6 };
}

/**
 * v6 → v7. An anchoring job is spent when its last anchor lands, so a world
 * carries the job-ms a *closed* one banked — the floor a cancel returns to
 * rather than zero.
 *
 * Zero on every v6 world, and correct on all of them: a job still in flight has
 * banked nothing by definition, and one that had already finished banks itself
 * on the harness's first tick, which closes it.
 */
function toSeven(state: Raw): Raw {
  const planets = state.planets as Raw | undefined;
  const states = (planets?.states ?? {}) as Record<string, Raw>;

  Object.values(states).forEach((planet) => {
    planet.bankedMs = 0;
  });

  return { ...state, version: 7 };
}

/**
 * v7 → v8. Held karma weighs, and the reading is frozen between worlds, so the
 * save carries the last one. Zero is what the first tick with income overwrites;
 * loaded in the gap, it reads as no weight until the next world pays.
 */
function toEight(state: Raw): Raw {
  return { ...state, version: 8, weight: { income: 0, backlog: 0 } };
}

/** Keyed by the version each step raises *from*. */
const STEPS: Record<number, (state: Raw) => Raw> = {
  3: toFour,
  4: toFive,
  5: toSix,
  6: toSeven,
  7: toEight,
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
