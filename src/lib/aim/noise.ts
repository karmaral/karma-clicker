/** Cohorts wander instead of jittering — `Math.random` per emission reads as a bug. */

function seedFrom(key: string) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function latticeValue(seed: number, step: number) {
  let hash = Math.imul(seed ^ step, 2654435761);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822519);
  hash ^= hash >>> 13;

  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Smoothly interpolated noise in −1…1, deterministic per `key`. */
export function noise(key: string, latticeUnits: number) {
  const seed = seedFrom(key);
  const step = Math.floor(latticeUnits);
  const from = latticeValue(seed, step);
  const to = latticeValue(seed, step + 1);

  return from + (to - from) * smoothstep(latticeUnits - step);
}
