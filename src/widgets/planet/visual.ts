/**
 * Everything a planet's picture is made of. Authored in the lab, pasted into
 * `$data/planet-visuals`, and read by `PlanetView`. Nothing here is game state —
 * `Planet` never sees it.
 */
export interface PlanetVisual {
  seed: number;

  /**
   * Shape — the noise field, which both displaces the sphere radially and feeds
   * the `land` band. It is normalised to its own measured range, so every one of
   * these changes the picture's character without changing how much of the band
   * range the terrain is worth. That is `land`'s job alone.
   */
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  /** 0 rounded hills, 1 creased ridges. The difference between landform and crinkle. */
  ridge: number;
  /** Slides the sample point across the sphere. Marbles the terrain, swirls `strata`. */
  warp: number;
  /**
   * Blend from terrain to latitude bands — 0 a world, 1 a gas giant. The stripes
   * are read at the warped latitude, so `warp` is what stops them being a barcode.
   * Their frequency competes with `detail` for the same budget: bands are shaded
   * from a per-vertex height, so anything finer than the mesh reads as polygons.
   */
  strata: number;
  strataFrequency: number;
  /**
   * How far the field moves the surface. Signed: positive raises the peaks,
   * negative carves them inward, and because the texture reads the field's own
   * height rather than the radius, the same map can be embossed or engraved
   * without the pattern changing. Pairs with `relief`, which is the same
   * quantity for the shading normal alone.
   */
  amplitude: number;
  /**
   * Flattens the field's negative half onto the sphere, so the amplitude only
   * ever works one way: at 1 a negative amplitude cuts pits into a smooth ball
   * and cannot push ridges back out, and a positive one raises without denting.
   * The texture is unaffected and still reads the whole field.
   */
  clip: number;
  /** Edge subdivisions, not recursive: the mesh is 20·(detail+1)² triangles. */
  detail: number;

  /**
   * Two layers, quantised separately.
   *
   * `land` is the *texture* — the terrain, read from a vertex attribute, so it
   * is the only term that turns with the surface. The field is normalised, so it
   * reads directly: 1 is the terrain owning the whole ramp, 0.25 a quarter of it.
   *
   * `rim` and `key` are the *shade*, both view-space, and neither reaches the
   * band coordinate. They are composited afterwards as a shift along the ramp,
   * which is what keeps the pattern a property of the world instead of of where
   * the camera stands. `rim` is signed: positive darkens the limb, negative
   * lightens it — the atmosphere reading. With `land` and shadeDepth` both at
   * zero, nothing is left but a flat fill and the outline.
   *
   * The shading normal is always the field's own, so the shade follows the
   * terrain's slope rather than the triangles under it — which is why `detail`
   * should be pushed as high as a world can afford.
   */
  rim: number;
  rimGamma: number;
  land: number;
  /**
   * How much of the key this world takes. Not a light — there is no light — but
   * the same maths, and the only term that tells you which way a slope faces.
   * Where it comes from is not authored here: the aim is one token for the whole
   * system, in `light.svelte.ts`, and the anchors read the same one.
   */
  key: number;
  bias: number;
  steps: number;
  toneFloor: number;
  toneCeil: number;
  /**
   * A hairline at each band boundary, in pixels — the band's edge drawn instead
   * of left as a step between two tones. Its width is independent of `detail`,
   * so it is the band mark that survives at 40px; its *path* is not, and kinks
   * at triangle scale. With `toneFloor` and `toneCeil` equal it is the only
   * thing drawn, which is a flat body carrying line work and nothing else.
   */
  contour: number;
  /**
   * Two inks, picked by which side of the terminator the line falls on rather
   * than by the tone under it — so a contour stays legible crossing out of a
   * pale band into a dark one. The switch is the shade level, which is computed
   * whatever `shadeDepth` is: at 0 the contour's ink is then the only thing on
   * the planet saying where the light comes from.
   */
  contourTone: number;
  contourShadowTone: number;
  /**
   * How the shade composites. `shadeSteps` is its granularity — 1 is a
   * three-tone terminator, 2 a five-tone one — and `shadeDepth` is how many ramp
   * slots each level moves the texture's tone by. At 0 the picture is the
   * texture alone, with `rim`, `key` and the key's aim all still authored and
   * inert, so it is one knob from flat to shaded and back.
   */
  shadeSteps: number;
  shadeDepth: number;
  /**
   * Terrain in the shading normal that the surface does not actually have —
   * added to `amplitude`, so it is what lets a disc at `amplitude` 0 still be
   * lit by its own landscape instead of banding as plane cuts of a sphere.
   * Signed like `amplitude`, and opposite signs shade against the geometry.
   * Baked per vertex, so it rebuilds the mesh.
   */
  relief: number;

  /** Outline, in pixels — held constant on screen at any widget size. */
  outline: number;
  outlineTone: number;

  /** Motion. */
  spin: number;
  tilt: number;
}

export type VisualGroup = 'Shape' | 'Texture' | 'Shade' | 'Outline' | 'Motion';

export interface VisualParam {
  key: keyof PlanetVisual;
  label: string;
  group: VisualGroup;
  min: number;
  max: number;
  step: number;
  /** Rebuilding geometry is the only expensive change, so it is marked rather than guessed. */
  shape?: true;
}

/** The lab's whole control surface. A new knob is a line here and a uniform. */
export const VISUAL_PARAMS: VisualParam[] = [
  { key: 'frequency', label: 'Frequency', group: 'Shape', min: 0.2, max: 8, step: 0.05, shape: true },
  { key: 'octaves', label: 'Octaves', group: 'Shape', min: 1, max: 6, step: 1, shape: true },
  { key: 'lacunarity', label: 'Lacunarity', group: 'Shape', min: 1, max: 4, step: 0.05, shape: true },
  { key: 'gain', label: 'Gain', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'ridge', label: 'Ridge', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'warp', label: 'Warp', group: 'Shape', min: 0, max: 0.6, step: 0.005, shape: true },
  { key: 'strata', label: 'Strata', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'strataFrequency', label: 'Strata bands', group: 'Shape', min: 1, max: 12, step: 0.5, shape: true },
  { key: 'amplitude', label: 'Amplitude', group: 'Shape', min: -0.6, max: 0.6, step: 0.005, shape: true },
  { key: 'clip', label: 'Clip', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'detail', label: 'Detail', group: 'Shape', min: 1, max: 48, step: 1, shape: true },

  { key: 'land', label: 'Land', group: 'Texture', min: 0, max: 1.5, step: 0.01 },
  { key: 'bias', label: 'Bias', group: 'Texture', min: -0.6, max: 0.6, step: 0.01 },
  { key: 'steps', label: 'Steps', group: 'Texture', min: 1, max: 8, step: 1 },
  { key: 'toneFloor', label: 'Tone floor', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'toneCeil', label: 'Tone ceiling', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'contour', label: 'Contour px', group: 'Texture', min: 0, max: 4, step: 0.25 },
  { key: 'contourTone', label: 'Contour lit', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'contourShadowTone', label: 'Contour shadow', group: 'Texture', min: 0, max: 6, step: 1 },

  { key: 'shadeDepth', label: 'Shade depth', group: 'Shade', min: -6, max: 6, step: 0.5 },
  { key: 'shadeSteps', label: 'Shade steps', group: 'Shade', min: 1, max: 6, step: 1 },
  { key: 'relief', label: 'Relief', group: 'Shade', min: -0.6, max: 0.6, step: 0.005, shape: true },
  { key: 'key', label: 'Key', group: 'Shade', min: 0, max: 1.5, step: 0.01 },
  { key: 'rim', label: 'Rim', group: 'Shade', min: -1.5, max: 1.5, step: 0.01 },
  { key: 'rimGamma', label: 'Rim sharpness', group: 'Shade', min: 0.25, max: 10, step: 0.05 },

  { key: 'outline', label: 'Outline px', group: 'Outline', min: 0, max: 8, step: 0.25 },
  { key: 'outlineTone', label: 'Outline tone', group: 'Outline', min: 0, max: 6, step: 1 },

  { key: 'spin', label: 'Spin', group: 'Motion', min: -0.6, max: 0.6, step: 0.005 },
  { key: 'tilt', label: 'Tilt', group: 'Motion', min: -0.8, max: 0.8, step: 0.01 },
];

export const VISUAL_GROUPS: VisualGroup[] = ['Shape', 'Texture', 'Shade', 'Outline', 'Motion'];

export const DEFAULT_VISUAL: PlanetVisual = {
  seed: 1,

  frequency: 1.8,
  octaves: 3,
  lacunarity: 2,
  gain: 0.5,
  ridge: 0,
  warp: 0,
  strata: 0,
  strataFrequency: 4,
  amplitude: 0.07,
  clip: 0,
  detail: 28,

  rim: 0.7,
  rimGamma: 2.4,
  land: 0.5,
  key: 0,
  bias: -0.1,
  steps: 4,
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

  spin: 0.1,
  tilt: 0.2,
};

/**
 * Only the fields that change the mesh — shading edits must not rebuild it.
 * `relief` is here despite being a shading control, because it is baked into
 * the normals rather than read from a uniform.
 */
export function keyShape(visual: PlanetVisual) {
  return [
    visual.seed, visual.frequency, visual.octaves, visual.lacunarity, visual.gain,
    visual.ridge, visual.warp, visual.strata, visual.strataFrequency,
    visual.amplitude, visual.clip, visual.relief, visual.detail,
  ].join('/');
}

export function cloneVisual(visual: PlanetVisual): PlanetVisual {
  return { ...visual };
}

/** A TS literal, ready to paste into `$data/planet-visuals`. */
export function printVisual(id: string, visual: PlanetVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `    ${key}: ${Number(value.toFixed(4))},`,
  );

  return `  '${id}': {\n${lines.join('\n')}\n  },`;
}
