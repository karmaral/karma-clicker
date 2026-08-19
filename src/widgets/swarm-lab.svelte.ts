import {
  cloneSwarm, DEFAULT_SWARM, printSwarm, riderCount, SOUL_CAPACITY, type SwarmVisual,
} from './planet';

/**
 * The lab's working copy of the swarm. One record rather than the planet lab's
 * many: every world's souls orbit the same way, and a per-planet swarm is a
 * decision nothing has asked for yet.
 */
function createSwarmLab() {
  const draft = $state<SwarmVisual>(cloneSwarm(DEFAULT_SWARM));

  /**
   * How many bands and how full, as workbench state rather than swarm authoring:
   * counts are game state, and `print` must not learn about them. Even per band,
   * which is also the only way to read one band's density off the strip.
   */
  const size = $state({ bands: 4, per: 12 });

  const counts = $derived(Array.from({ length: size.bands }, () => size.per));

  /** What the sliders actually come to, capped as `createSouls` caps it. */
  const souls = $derived(Math.min(SOUL_CAPACITY, size.bands * size.per));

  /**
   * The share of the swarm on the lines, as the whole souls it buys — a share
   * that buys no further soul changed nothing, and the slider cannot say so.
   */
  const riders = $derived(riderCount(draft, souls));

  function resize(key: 'bands' | 'per', value: number) {
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
    get counts() { return counts; },
    get souls() { return souls; },
    get riders() { return riders; },
    resize,
    set,
    reset,
    reseed,
    revert,
    print: () => printSwarm(draft),
  };
}

export const swarmLab = createSwarmLab();
