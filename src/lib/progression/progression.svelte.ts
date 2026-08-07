import { beats } from './beats';
import { createTriggerContext } from './context';
import type { RevealKey, RevealState, SystemKey } from './keys';

const ctx = createTriggerContext();

/** Beats reached. 0 means none; 1 means beat 1. Only ever climbs. */
let reached = $state(0);

const revealed = $derived.by(() => {
  const map: Partial<Record<RevealKey, RevealState>> = {};
  for (let i = 0; i < reached; i++) {
    Object.assign(map, beats[i].reveals);
  }
  return map;
});

const running = $derived.by(() => {
  const set = new Set<SystemKey>();
  for (let i = 0; i < reached; i++) {
    beats[i].runs?.forEach((system) => set.add(system));
  }
  return set;
});

function satisfied(index: number) {
  const beat = beats[index];
  if (beat.when(ctx)) return true;

  return beat.floor !== undefined && ctx.total('experience') >= beat.floor;
}

/**
 * Advances one beat at a time so the frame accretes in order — a later beat
 * whose trigger fires early waits its turn rather than skipping ahead.
 */
function evaluate() {
  const before = reached;
  while (reached < beats.length && satisfied(reached)) {
    reached += 1;
  }
  return reached > before;
}

export const progression = {
  get beat() { return reached; },
  get current() { return reached > 0 ? beats[reached - 1] : undefined; },

  reveal(key: RevealKey): RevealState {
    return revealed[key] ?? 'absent';
  },
  isRevealed(key: RevealKey) {
    return this.reveal(key) !== 'absent';
  },
  isLive(key: RevealKey) {
    return this.reveal(key) === 'live';
  },
  runs(system: SystemKey) {
    return running.has(system);
  },

  evaluate,

  /** Dev and the Preview scrubber. Skips triggers entirely. */
  jumpTo(beat: number) {
    reached = Math.max(0, Math.min(beats.length, beat));
  },
};
