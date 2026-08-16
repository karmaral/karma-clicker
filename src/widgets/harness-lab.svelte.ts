import { cloneHarness, DEFAULT_HARNESS, printHarness, type HarnessVisual } from './planet';

/**
 * The lab's working copy of the harness. One record for all worlds, as the
 * anchors' is: a pair's family comes from the pair alone, so there is nothing
 * per planet to author. How many anchors are placed is the anchor lab's, since
 * that is what the harness is strung between.
 */
function createHarnessLab() {
  const draft = $state<HarnessVisual>(cloneHarness(DEFAULT_HARNESS));

  function set(key: keyof HarnessVisual, value: number) {
    if (!Number.isFinite(value)) return;

    draft[key] = value;
  }

  /** One slider's worth of `revert` — what a double-click on it undoes. */
  function reset(key: keyof HarnessVisual) {
    draft[key] = DEFAULT_HARNESS[key];
  }

  function revert() {
    Object.assign(draft, DEFAULT_HARNESS);
  }

  return {
    get current() { return draft; },
    set,
    reset,
    revert,
    print: () => printHarness(draft),
  };
}

export const harnessLab = createHarnessLab();