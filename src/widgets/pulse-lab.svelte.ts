import { clonePulse, DEFAULT_PULSE, printPulse, type PulseVisual } from './planet';

/**
 * The lab's working copy of the click. One record rather than the planet lab's
 * many, on the swarm lab's argument: every world answers a click the same way,
 * and a per-planet pulse is a decision nothing has asked for yet.
 *
 * There is no *fire* button here. The trigger is the widget itself — clicking
 * the world is the interaction being designed, and a button in the panel would
 * be a second way to reach it that the game will never have.
 */
function createPulseLab() {
  const draft = $state<PulseVisual>(clonePulse(DEFAULT_PULSE));

  function set(key: keyof PulseVisual, value: number) {
    if (!Number.isFinite(value)) return;

    draft[key] = value;
  }

  /** One slider's worth of `revert` — what a double-click on it undoes. */
  function reset(key: keyof PulseVisual) {
    draft[key] = DEFAULT_PULSE[key];
  }

  function revert() {
    Object.assign(draft, DEFAULT_PULSE);
  }

  return {
    get current() { return draft; },
    set,
    reset,
    revert,
    print: () => printPulse(draft),
  };
}

export const pulseLab = createPulseLab();
