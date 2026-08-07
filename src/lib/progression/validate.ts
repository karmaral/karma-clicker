import { beats } from './beats';
import { SYSTEM_SURFACES, rank, type RevealKey, type RevealState, type SystemKey } from './keys';

/** Structural checks on the registry. Empty result means it is coherent. */
export function validate() {
  const problems: string[] = [];

  const seen = new Set<string>();
  beats.forEach((beat) => {
    if (seen.has(beat.id)) {
      problems.push(`duplicate beat id: ${beat.id}`);
    }
    seen.add(beat.id);
  });

  // Reveals only ever climb.
  const highest: Partial<Record<RevealKey, RevealState>> = {};
  beats.forEach((beat, i) => {
    for (const [key, state] of Object.entries(beat.reveals ?? {}) as [RevealKey, RevealState][]) {
      const previous = highest[key];
      if (previous && rank(state) < rank(previous)) {
        problems.push(`beat ${i + 1} (${beat.id}) lowers ${key}: ${previous} → ${state}`);
      }
      highest[key] = state;
    }
  });

  const firstRun = new Map<SystemKey, number>();
  const firstReveal = new Map<RevealKey, number>();
  beats.forEach((beat, i) => {
    beat.runs?.forEach((system) => {
      if (!firstRun.has(system)) {
        firstRun.set(system, i);
      }
    });
    for (const key of Object.keys(beat.reveals ?? {}) as RevealKey[]) {
      if (!firstReveal.has(key)) {
        firstReveal.set(key, i);
      }
    }
  });

  // Nothing is added that wasn't already running.
  for (const [system, surfaces] of Object.entries(SYSTEM_SURFACES) as [SystemKey, RevealKey[]][]) {
    const runsAt = firstRun.get(system);
    if (runsAt === undefined) continue;
    surfaces.forEach((key) => {
      const revealsAt = firstReveal.get(key);
      if (revealsAt !== undefined && revealsAt < runsAt) {
        problems.push(
          `${key} is drawn at beat ${revealsAt + 1} before ${system} runs at beat ${runsAt + 1}`,
        );
      }
    });
  }

  // Every beat needs an escape, or an explicit note that it does not have one.
  beats.forEach((beat, i) => {
    if (i > 0 && beat.floor === undefined && !beat.eventOnly) {
      problems.push(`beat ${i + 1} (${beat.id}) can stall: no floor and not marked eventOnly`);
    }
  });

  return problems;
}
