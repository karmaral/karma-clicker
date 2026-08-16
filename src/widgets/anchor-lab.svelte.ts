import { ANCHOR_MAX, cloneAnchor, DEFAULT_ANCHOR, printAnchor, type AnchorVisual } from './planet';

/**
 * The lab's working copy of the anchors. One record for all worlds, as the
 * swarm's is: placement comes from the count alone, so there is nothing per
 * planet to author.
 */
function createAnchorLab() {
  const draft = $state<AnchorVisual>(cloneAnchor(DEFAULT_ANCHOR));

  /**
   * How many and how many are in, as workbench state rather than authoring —
   * both are game state, and `print` must not learn about them.
   */
  const size = $state({ count: 4, placed: 2 });

  const anchored = $derived(Array.from({ length: size.count }, (unused, i) => i < size.placed));

  function resize(key: 'count' | 'placed', value: number) {
    if (!Number.isFinite(value)) return;

    size[key] = Math.max(key === 'count' ? 1 : 0, Math.min(ANCHOR_MAX, Math.round(value)));
    size.placed = Math.min(size.placed, size.count);
  }

  function set(key: keyof AnchorVisual, value: number) {
    if (!Number.isFinite(value)) return;

    draft[key] = value;
  }

  /** One slider's worth of `revert` — what a double-click on it undoes. */
  function reset(key: keyof AnchorVisual) {
    draft[key] = DEFAULT_ANCHOR[key];
  }

  function revert() {
    Object.assign(draft, DEFAULT_ANCHOR);
  }

  return {
    get current() { return draft; },
    get size() { return size; },
    get anchored() { return anchored; },
    resize,
    set,
    reset,
    revert,
    print: () => printAnchor(draft),
  };
}

export const anchorLab = createAnchorLab();
