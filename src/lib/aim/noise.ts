/**
 * 1D value noise. Cohorts wander instead of jittering, which reads as
 * personality rather than error (CONTEXT v3 §3.4) — `Math.random` per emission
 * would look like a bug.
 */

/** Deterministic per cohort, so a given soul type always drifts the same way. */
function seedOf(key: string) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/** Hashed lattice point — a stable pseudo-random in −1…1 for one integer step. */
function at(seed: number, step: number) {
  let hash = Math.imul(seed ^ step, 2654435761);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822519);
  hash ^= hash >>> 13;

  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Smoothly interpolated noise in −1…1. `t` is in lattice units, not ms. */
export function noise(key: string, t: number) {
  const seed = seedOf(key);
  const step = Math.floor(t);
  const frac = t - step;
  const from = at(seed, step);
  const to = at(seed, step + 1);

  return from + (to - from) * smoothstep(frac);
}
