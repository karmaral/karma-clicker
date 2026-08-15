/**
 * Seeded 3D gradient noise. Sampled on the direction vector rather than a UV,
 * so a sphere has no seam and no pole to pinch. `$lib/aim/noise` is 1D and for
 * drift — unrelated.
 */

const GRADIENTS = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

export interface FbmOptions {
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  /** 0 rounded, 1 creased. Folded per octave — ridging the sum only bends it once. */
  ridge?: number;
}

export type Noise3D = (x: number, y: number, z: number) => number;

/** Fisher–Yates over 0…255, driven by xorshift so one integer fixes the field. */
function buildPermutation(seed: number) {
  const source = new Uint8Array(256);
  for (let i = 0; i < 256; i++) source[i] = i;

  let state = (seed | 0) || 0x9e3779b9;
  for (let i = 255; i > 0; i--) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    const j = (state >>> 0) % (i + 1);
    const swap = source[i];
    source[i] = source[j];
    source[j] = swap;
  }

  const table = new Uint8Array(512);
  for (let i = 0; i < 512; i++) table[i] = source[i & 255];

  return table;
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function mix(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function projectGradient(hash: number, x: number, y: number, z: number) {
  const g = GRADIENTS[hash % 12];

  return g[0] * x + g[1] * y + g[2] * z;
}

/** Perlin gradient noise, roughly −1…1. */
export function createNoise3D(seed: number): Noise3D {
  const p = buildPermutation(seed);

  return (x, y, z) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const a = p[xi] + yi;
    const aa = p[a] + zi;
    const ab = p[a + 1] + zi;
    const b = p[xi + 1] + yi;
    const ba = p[b] + zi;
    const bb = p[b + 1] + zi;

    const x1 = mix(
      projectGradient(p[aa], xf, yf, zf),
      projectGradient(p[ba], xf - 1, yf, zf),
      u,
    );
    const x2 = mix(
      projectGradient(p[ab], xf, yf - 1, zf),
      projectGradient(p[bb], xf - 1, yf - 1, zf),
      u,
    );
    const y1 = mix(x1, x2, v);

    const x3 = mix(
      projectGradient(p[aa + 1], xf, yf, zf - 1),
      projectGradient(p[ba + 1], xf - 1, yf, zf - 1),
      u,
    );
    const x4 = mix(
      projectGradient(p[ab + 1], xf, yf - 1, zf - 1),
      projectGradient(p[bb + 1], xf - 1, yf - 1, zf - 1),
      u,
    );
    const y2 = mix(x3, x4, v);

    return mix(y1, y2, w);
  };
}

/**
 * Octave sum, divided by the amplitude sum. That is the *theoretical* range, not
 * the reachable one — Perlin rarely leaves ±0.7 and decorrelated octaves shrink
 * it further, so the result here is only ever about half of −1…1. `field.ts`
 * measures the rest.
 */
export function sampleFbm(noise: Noise3D, x: number, y: number, z: number, options: FbmOptions) {
  const ridge = options.ridge ?? 0;
  let frequency = options.frequency;
  let amplitude = 1;
  let total = 0;
  let range = 0;

  for (let i = 0; i < options.octaves; i++) {
    const value = noise(x * frequency, y * frequency, z * frequency);

    // 1 − 2|n| turns each zero crossing into a crest. Ridging every octave is
    // what makes a crease run; ridging the sum just dents it.
    total += (ridge ? value + (1 - 2 * Math.abs(value) - value) * ridge : value) * amplitude;
    range += amplitude;
    frequency *= options.lacunarity;
    amplitude *= options.gain;
  }

  return range === 0 ? 0 : total / range;
}
