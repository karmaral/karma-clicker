import {
  cloneSwarm, DEFAULT_SWARM, HARVEST_ANCHOR, HARVEST_RADIUS, printSwarm, riderCount,
  shareOf, SOUL_CAPACITY, type SwarmVisual,
} from './planet';

/**
 * The lab's working copy of the swarm. One record rather than the planet lab's
 * many: every world's souls orbit the same way, and a per-planet swarm is a
 * decision nothing has asked for yet.
 */
function createSwarmLab() {
  const draft = $state<SwarmVisual>(cloneSwarm(DEFAULT_SWARM));

  /**
   * How many bands, how full, and how many of them stream — workbench state
   * rather than swarm authoring: counts are game state, and `print` must not
   * learn about them. Even per band, which is also the only way to read one
   * band's density off the strip.
   *
   * `streams` is the inner bands, because that is the order the game collapses
   * them in: the shortest lives are the first to stop being lives. 0 is a world
   * where every band still has a clock, which is where a run starts.
   */
  const size = $state({ bands: 4, per: 12, streams: 0 });

  /**
   * The share staying, on the same footing as the counts and for the same
   * reason: it is what a screen would hand the swarm, not something the swarm
   * is authored with. `undefined` is the state every screen but Harvest is in,
   * so the lab has to be able to sit in it too.
   */
  const split = $state<{ merge: number | undefined }>({ merge: undefined });

  /**
   * The harvest stage's three numbers — how big the world is drawn, how tall
   * the box around it is, and where down that box it stands. Workbench state
   * again, and a **set**, because none of them reads on its own: the same radius
   * in a taller box is a smaller world, `strayTo`'s ceiling is the box rather
   * than the disc, and the anchor decides how much room is left under the swarm
   * for the controls.
   *
   * Radius and room in pixels, the anchor a percent. Sliders here and constants
   * in `visual.ts` — the same round trip every other lab makes, except that
   * these are the screen's rather than a world's, so they are typed back by hand
   * instead of pasted.
   */
  const stage = $state({ radius: HARVEST_RADIUS, room: 640, anchor: HARVEST_ANCHOR * 100 });

  const counts = $derived(Array.from({ length: size.bands }, () => size.per));

  /** The same rows, as the flags a screen would hand the swarm. */
  const streaming = $derived(Array.from({ length: size.bands }, (_, band) => band < size.streams));

  /** What the sliders actually come to, capped as `createSouls` caps it. */
  const souls = $derived(Math.min(SOUL_CAPACITY, size.bands * size.per));

  /**
   * The share of the swarm on the lines, as the whole souls it buys — a share
   * that buys no further soul changed nothing, and the slider cannot say so.
   */
  const riders = $derived(riderCount(draft, souls));

  /** The same, for the split: the whole souls this share leaves with the world. */
  const staying = $derived(split.merge === undefined ? undefined : shareOf(split.merge, souls));

  /** Off is a distinct state, not 0 — at 0 the whole swarm is gathered to leave. */
  function setMerge(value: number | undefined) {
    split.merge = value === undefined || !Number.isFinite(value)
      ? undefined
      : Math.max(0, Math.min(1, value));
  }

  /**
   * Whole pixels, and never nothing: a zero box divides by nought in `frame`.
   * The anchor is the exception at both ends — it is a position rather than a
   * measure, and 0 is the box's top edge, a place like any other.
   */
  function restage(key: 'radius' | 'room' | 'anchor', value: number) {
    if (!Number.isFinite(value)) return;

    stage[key] = key === 'anchor'
      ? Math.max(0, Math.min(100, Math.round(value)))
      : Math.max(1, Math.round(value));
  }

  function resize(key: 'bands' | 'per' | 'streams', value: number) {
    if (!Number.isFinite(value)) return;

    size[key] = Math.max(key === 'bands' ? 1 : 0, Math.round(value));
  }

  function set(key: keyof SwarmVisual, value: number) {
    if (!Number.isFinite(value)) return;

    draft[key] = value;
  }

  /** One slider's worth of `revert` — what a double-click on it undoes. */
  function reset(key: keyof SwarmVisual) {
    draft[key] = DEFAULT_SWARM[key];
  }

  function reseed() {
    draft.seed = Math.floor(Math.random() * 100_000);
  }

  function revert() {
    Object.assign(draft, DEFAULT_SWARM);
  }

  return {
    get current() { return draft; },
    get size() { return size; },
    get stage() { return stage; },
    get counts() { return counts; },
    get streaming() { return streaming; },
    get souls() { return souls; },
    get riders() { return riders; },
    get merge() { return split.merge; },
    get staying() { return staying; },
    setMerge,
    restage,
    resize,
    set,
    reset,
    reseed,
    revert,
    print: () => printSwarm(draft),
  };
}

export const swarmLab = createSwarmLab();
