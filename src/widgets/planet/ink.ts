import * as THREE from 'three';

/**
 * The planet may only be painted in tokens. Bands quantise to an index in this
 * ramp, so no shader can invent a grey the design system does not own.
 */
const RAMP_TOKENS = [
  '--surface',
  '--ink-200',
  '--ink-300',
  '--ink-400',
  '--ink-500',
  '--ink-700',
  '--ink-900',
];

const FALLBACK = ['#ffffff', '#c2c2c2', '#a3a3a3', '#8a8a8a', '#767676', '#555555', '#111111'];

/** Uniform arrays are fixed-length in GLSL; the ramp is padded to this. */
export const RAMP_SLOTS = 8;

export const RAMP_SIZE = RAMP_TOKENS.length;

export function readToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  return value || fallback;
}

export function readInkRamp() {
  const colors = RAMP_TOKENS.map((token, i) => new THREE.Color(readToken(token, FALLBACK[i])));

  while (colors.length < RAMP_SLOTS) colors.push(colors[colors.length - 1].clone());

  return colors;
}

/** Hex for the DOM side of the lab — swatches, panel chrome. */
export function readInkHexes() {
  return RAMP_TOKENS.map((token, i) => readToken(token, FALLBACK[i]));
}
