import { createNoise3D, sampleFbm } from './noise';
import type { PlanetVisual } from './visual';

/**
 * The planet's surface as a function of direction. The mesh is built from it and
 * anything placed *on* the surface reads the same field, so a marker and the
 * terrain under it can never disagree.
 */
export interface SurfaceField {
  /** Terrain at a unit direction, −1…1 — the full range, measured, not assumed. */
  sampleHeight(x: number, y: number, z: number): number;
  /** What actually moves the surface: the height with its far side clipped off. */
  sampleDisplacement(x: number, y: number, z: number): number;
  /** Where the surface sits along that direction, in object units. */
  sampleRadius(x: number, y: number, z: number): number;
}

/**
 * Directions used to measure the field's range. Fixed and low-discrepancy, so
 * normalisation is a property of the settings alone — the same visual gives the
 * same field at every `detail`. A dense mesh finds wider extremes than 4096
 * probes did: measured across the family, up to 13% past ±1. That is left alone
 * rather than clamped — `t` clamps anyway, and clipping the tails would flatten
 * exactly the peaks `ridge` exists to make.
 */
const PROBES = 4096;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Arbitrary, mutually distant offsets — three reads of one field, not three fields. */
const WARP_OFFSETS = [
  [19.3, 7.1, 3.7],
  [5.2, 23.9, 11.4],
  [31.6, 2.8, 17.5],
];

/**
 * Maps the field's own reachable range onto −1…1. Without this `land` is worth
 * whatever the octave settings happen to leave it — measured, that was half a
 * band step on two of the authored worlds, which is why their terrain never
 * crossed a contour. It is also what lets `ridge` and `strata` be added at all:
 * each changes the raw range, and normalisation absorbs the change instead of
 * making every existing band setting mean something new.
 */
function measureRange(sample: (x: number, y: number, z: number) => number) {
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < PROBES; i++) {
    const y = 1 - (i / (PROBES - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = GOLDEN_ANGLE * i;
    const height = sample(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

    if (height < min) min = height;
    if (height > max) max = height;
  }

  const span = max - min;
  if (span < 1e-6) return { scale: 0, offset: 0 };

  const scale = 2 / span;

  return { scale, offset: -1 - min * scale };
}

export function createSurfaceField(visual: PlanetVisual): SurfaceField {
  const noise = createNoise3D(visual.seed);
  const options = {
    frequency: visual.frequency,
    octaves: Math.max(1, Math.round(visual.octaves)),
    lacunarity: visual.lacunarity,
    gain: visual.gain,
    ridge: visual.ridge,
  };

  const { warp, strata, strataFrequency } = visual;

  // The warped direction. Held here rather than returned, so the hot loop that
  // builds the mesh allocates nothing.
  let wx = 0;
  let wy = 0;
  let wz = 0;

  /**
   * Domain warp: push the sample point around by the field itself, then put it
   * back on the sphere. Renormalising is what keeps it a slide across the
   * surface rather than a second displacement — and it is what turns `strata`
   * from a barcode into weather.
   */
  function warpAt(x: number, y: number, z: number) {
    if (warp <= 0) {
      wx = x;
      wy = y;
      wz = z;

      return;
    }

    const px = x * options.frequency;
    const py = y * options.frequency;
    const pz = z * options.frequency;

    const [a, b, c] = WARP_OFFSETS;
    const nx = x + warp * noise(px + a[0], py + a[1], pz + a[2]);
    const ny = y + warp * noise(px + b[0], py + b[1], pz + b[2]);
    const nz = z + warp * noise(px + c[0], py + c[1], pz + c[2]);

    const length = Math.hypot(nx, ny, nz) || 1;
    wx = nx / length;
    wy = ny / length;
    wz = nz / length;
  }

  /** Before normalisation — nothing outside this function may call it. */
  function rawHeight(x: number, y: number, z: number) {
    warpAt(x, y, z);

    const terrain = sampleFbm(noise, wx, wy, wz, options);
    if (strata <= 0) return terrain;

    // Latitude of the *warped* point, so the bands inherit the swirl.
    const stripe = Math.sin(wy * strataFrequency * Math.PI);

    return terrain + (stripe - terrain) * strata;
  }

  const { scale, offset } = measureRange(rawHeight);

  function sampleHeight(x: number, y: number, z: number) {
    return rawHeight(x, y, z) * scale + offset;
  }

  /**
   * `clip` flattens the field's negative half onto the sphere, so everything the
   * amplitude does then happens on one side of it: a negative amplitude cuts in
   * and never pushes back out, and a positive one raises without denting. The
   * clip line is the field's own midline, which is a real place because the
   * field is normalised — and `bias` cannot move it, being texture-side only.
   *
   * The texture is not clipped. It keeps reading `sampleHeight`, so the flat
   * half still carries its bands and the same map can be cut or raised without
   * the pattern changing.
   */
  function sampleDisplacement(x: number, y: number, z: number) {
    const height = sampleHeight(x, y, z);

    return height >= 0 ? height : height * (1 - visual.clip);
  }

  return {
    sampleHeight,
    sampleDisplacement,
    sampleRadius: (x, y, z) => 1 + visual.amplitude * sampleDisplacement(x, y, z),
  };
}
