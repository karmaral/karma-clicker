import type { SoundData } from '$lib/sound.svelte';

/**
 * One pool per sound id. `folder` names a subfolder of `src/assets/sounds` —
 * every file in it joins the pool, so adding a take is just dropping a file in.
 */
export default {
  'planet.click': {
    folder: 'planet-click',
    volume: 0.85,
    /** Spread that keeps the takes from sounding identical. */
    rate: [0.94, 1.06],
  },

  'soul.purchase': {
    folder: 'planet-click',
    volume: 0.85,
    /** Wider than the click's — inside a burst, spread is what keeps ten
     *  voices from sounding like one sample echoing. */
    rate: [0.9, 1.1],
    /** What a quantity sounds like. A pool with no `burst` ignores any count
     *  passed to `play` and always plays one voice. */
    burst: {
      /** Souls past this share the last voice. */
      maxVoices: 30,
      /** Milliseconds between voices, before the wobble. */
      gap: 18,
      /** Wobble on each gap, as a share of it. 0 is an even grid. */
      jitter: 0.4,
      /** Gain step per voice. 1 is flat. */
      taper: 0.96,
    },
  },

  /**
   * The bed under the machine. Held rather than fired, and crossfaded to itself
   * every cycle, so the tempo is carried by the hit over it and never by the
   * drone starting again.
   */
  'refinery.drone': {
    /** The base take, and the one a tier with nothing recorded yet falls back to. */
    folder: 'refinery/drone-slow',
    /** A bed, not an event — it sits well under the click. */
    volume: 0.45,
    sustain: { fadeMs: 700 },
    /** Read against the refining cycle: 4000 slow, 3000 mid, 1500 fast. */
    tiers: [
      { belowMs: 2000, folder: 'refinery/drone-fast' },
      { belowMs: 3500, folder: 'refinery/drone-mid' },
    ],
  },

  /** The pull landing. Sounds on the payout, so it means refined, not started. */
  'refinery.hit': {
    folder: 'refinery/hit',
    volume: 0.7,
    rate: [0.97, 1.03],
  },

  /** Staffing crossing zero. Silent until takes land in these folders. */
  'refinery.spinup': {
    folder: 'refinery/spinup',
    volume: 0.7,
  },

  'refinery.spindown': {
    folder: 'refinery/spindown',
    volume: 0.7,
  },
} satisfies Record<string, SoundData>;
