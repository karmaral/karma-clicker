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
} satisfies Record<string, SoundData>;
