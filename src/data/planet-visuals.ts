import type { PlanetVisual } from '$widgets/planet';

/**
 * Authored in the widget lab (`?widgets`) and pasted here. Keyed by planet id,
 * so a world's picture and its numbers stay separate files — `Planet` never
 * reads this.
 *
 * **`first`, `second`, `third` and `cool_1` are current** — all re-authored
 * after the texture/shade split, and the four with a `shadeDepth` above zero.
 *
 * **`ridged` and `banded` are stale.** They were tuned when `rim`, `land` and
 * `key` were summed into one band coordinate; the two are now quantised
 * separately, and `shadeDepth: 0` leaves the shade out entirely, so each is
 * currently its texture alone. Nothing is lost — `rim` and `key` are untouched
 * and raising `shadeDepth` brings them back — but they want a pass in the lab.
 *
 * The key's *aim* is no longer authored here. There is one light in the system
 * and it lives in `light.svelte.ts`; a world still says how much of it it takes,
 * through `key`. The four aims these entries carried all sat within a few
 * degrees of each other, so nothing was ever being said by their differing.
 *
 * `ridged` and `banded` are specimens, not worlds — they exist so the two field
 * modes have something in the family strip.
 */
const data: Record<string, PlanetVisual> = {
  'first': {
    seed: 1,
    frequency: 2.2,
    octaves: 1,
    lacunarity: 1.7,
    gain: 0.41,
    ridge: 0.09,
    warp: 0.6,
    strata: 0,
    strataFrequency: 4,
    amplitude: -0.075,
    clip: 1,
    detail: 26,
    rim: 0.25,
    rimGamma: 3.5,
    land: 0.82,
    key: 1.03,
    bias: 0.05,
    steps: 4,
    toneFloor: 2,
    toneCeil: 6,
    contour: 1,
    contourTone: 6,
    contourShadowTone: 5,
    shadeSteps: 3,
    shadeDepth: 1,
    relief: -0.125,
    outline: 2,
    outlineTone: 6,
    spin: 0.185,
    tilt: -0.15,
  },
  'second': {
    seed: 33481,
    frequency: 0.2,
    octaves: 5,
    lacunarity: 2.9,
    gain: 0.44,
    ridge: 0.48,
    warp: 0.155,
    strata: 0.07,
    strataFrequency: 1.5,
    amplitude: 0.005,
    clip: 0.18,
    detail: 28,
    rim: -1.27,
    rimGamma: 7.05,
    land: 0.17,
    key: 1.5,
    bias: 0.07,
    steps: 5,
    toneFloor: 0,
    toneCeil: 4,
    contour: 1.5,
    contourTone: 5,
    contourShadowTone: 3,
    shadeSteps: 4,
    shadeDepth: 1.5,
    relief: 0.055,
    outline: 2,
    outlineTone: 3,
    spin: 0.09,
    tilt: 0.18,
  },
  /** Land-driven continents, sitting darker on the ramp. */
  'third': {
    seed: 8443,
    frequency: 1.95,
    octaves: 2,
    lacunarity: 3.55,
    gain: 0.85,
    ridge: 0.35,
    warp: 0,
    strata: 0,
    strataFrequency: 1,
    amplitude: 0.045,
    clip: 1,
    detail: 28,
    rim: -0.2,
    rimGamma: 2.45,
    land: 1.18,
    key: 1.28,
    bias: -0.6,
    steps: 4,
    toneFloor: 0,
    toneCeil: 6,
    contour: 1.5,
    contourTone: 6,
    contourShadowTone: 6,
    shadeSteps: 4,
    shadeDepth: 0.5,
    relief: 0.02,
    outline: 2,
    outlineTone: 6,
    spin: 0.07,
    tilt: 0.24,
  },
  'cool_1': {
    seed: 14781,
    frequency: 1.4,
    octaves: 2,
    lacunarity: 2.6,
    gain: 0.67,
    ridge: 0,
    warp: 0.215,
    strata: 0,
    strataFrequency: 4,
    amplitude: -0.08,
    clip: 1,
    detail: 28,
    rim: 1.5,
    rimGamma: 4.75,
    land: 1.02,
    key: 1.5,
    bias: 0.53,
    steps: 4,
    toneFloor: 0,
    toneCeil: 1,
    contour: 1.5,
    contourTone: 6,
    contourShadowTone: 1,
    shadeSteps: 4,
    shadeDepth: 1,
    relief: -0.005,
    outline: 2,
    outlineTone: 6,
    spin: 0.125,
    tilt: 0.31,
  },
  /**
   * Specimen. Creased highlands — `ridge` at 1, `land` high enough that the
   * terrain crosses several band boundaries instead of hovering inside one.
   *
   * Two octaves, not four. Ridging creases *every* octave, so the fine ones stop
   * being texture and become their own crevasse network — four octaves here read
   * as steel wool. Ridge wants a coarse field and takes its detail from the
   * crease, which is the opposite of how the smooth worlds are tuned.
   */
  'ridged': {
    seed: 5231,
    frequency: 1.2,
    octaves: 2,
    lacunarity: 1.9,
    gain: 0.3,
    ridge: 1,
    warp: 0.18,
    strata: 0,
    strataFrequency: 4,
    amplitude: 0.18,
    clip: 0,
    detail: 28,
    rim: 0.25,
    rimGamma: 2,
    land: 0.7,
    key: 0.5,
    bias: -0.08,
    steps: 5,
    toneFloor: 1,
    toneCeil: 6,
    contour: 0,
    contourTone: 6,
    contourShadowTone: 6,
    shadeSteps: 2,
    shadeDepth: 0,
    relief: 0,
    outline: 2,
    outlineTone: 6,
    spin: 0.08,
    tilt: 0.22,
  },
  /**
   * Specimen. Latitude bands pulled out of true by `warp`. `detail` is high
   * because the stripes are shaded from a per-vertex height — too few rows per
   * band and they read as polygons rather than weather.
   */
  'banded': {
    seed: 9042,
    frequency: 1.6,
    octaves: 3,
    lacunarity: 2.1,
    gain: 0.45,
    ridge: 0,
    warp: 0.28,
    strata: 0.8,
    strataFrequency: 5,
    amplitude: 0.02,
    clip: 0,
    detail: 36,
    rim: 0.2,
    rimGamma: 3,
    land: 0.7,
    key: 0.25,
    bias: -0.05,
    steps: 6,
    toneFloor: 0,
    toneCeil: 5,
    contour: 0,
    contourTone: 6,
    contourShadowTone: 6,
    shadeSteps: 2,
    shadeDepth: 0,
    relief: 0,
    outline: 2,
    outlineTone: 6,
    spin: 0.11,
    tilt: 0.26,
  },
};

export default data;