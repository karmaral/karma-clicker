/**
 * What a finished run leaves the next one. A few figures crossing one reload —
 * the reload being the reset, for the reason `storage.ts` gives.
 *
 * Its own version, not `SAVE_VERSION`: a legacy holds nothing a save holds, so
 * bumping the save format over an unrelated field would eat a player's wisdom.
 *
 * Its own file, not `storage.ts`: that module imports `state.ts`, which reaches
 * `progression`, which reaches `prestige` — and `prestige` is this file's only
 * writer. A leaf importing nothing is what keeps that from being a cycle.
 */

const LEGACY_KEY = 'karma-clicker:legacy';
const LEGACY_VERSION = 2;

export interface Legacy {
  version: number;
  wisdom: number;
  beat: number;
  /** The kept knowledge shelf, as `target/id`. Added in v2. */
  kept: string[];
}

/** v1 carried no shelf, so it reads as an empty one rather than a lost legacy. */
function toLegacy(value: unknown): Legacy | undefined {
  const legacy = value as Partial<Legacy> | null;
  if (!legacy || typeof legacy.wisdom !== 'number' || typeof legacy.beat !== 'number') return;

  if (legacy.version === 1) return { ...legacy, version: LEGACY_VERSION, kept: [] } as Legacy;
  if (legacy.version !== LEGACY_VERSION || !Array.isArray(legacy.kept)) return;

  return legacy as Legacy;
}

/** Written immediately before the reload. False means the run should not end. */
export function setLegacy(legacy: Omit<Legacy, 'version'>) {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ ...legacy, version: LEGACY_VERSION }));

    return true;
  } catch {
    return false;
  }
}

/**
 * Read once and cleared whatever happens, so a legacy that cannot be applied
 * cannot ambush a later boot — and a stale one across a deploy fails its
 * version check and leaves a fresh run rather than a broken one.
 */
export function takeLegacy(): Legacy | undefined {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    localStorage.removeItem(LEGACY_KEY);
    if (!raw) return;

    return toLegacy(JSON.parse(raw));
  } catch {
    return;
  }
}
