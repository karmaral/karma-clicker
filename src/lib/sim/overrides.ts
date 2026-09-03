/**
 * Lab values written into the data objects, by dotted path from a named root:
 * `buildings.cohort_1.cost`, `planets.second.harvest.mergeHalving`,
 * `balance.aim.reaimPenalty`. The root is explicit so a cohort can never be
 * mistaken for a data file.
 *
 * A path whose last key is not already in the data is dropped — the lab reads
 * its params off the data, so a miss is a typo, never a new field.
 */

type Node = Record<string, unknown>;

export const OVERRIDE_ROOTS = ['buildings', 'planets', 'balance'] as const;

export type OverrideRoot = (typeof OVERRIDE_ROOTS)[number];

function write(root: Node, keys: string[], value: number) {
  let node = root;

  for (const key of keys.slice(0, -1)) {
    const next = node[key];
    if (typeof next !== 'object' || next === null) return;

    node = next as Node;
  }

  const last = keys[keys.length - 1];
  if (!(last in node)) return;

  node[last] = value;
}

export function applyOverrides(
  roots: Partial<Record<OverrideRoot, unknown>>,
  overrides: Record<string, number>,
) {
  for (const [path, value] of Object.entries(overrides)) {
    const [root, ...rest] = path.split('.');
    const target = roots[root as OverrideRoot];
    if (!rest.length || typeof target !== 'object' || target === null) continue;

    write(target as Node, rest, value);
  }
}

/** What a path currently reads, for the lab to show beside its slider. */
export function readOverride(roots: Partial<Record<OverrideRoot, unknown>>, path: string) {
  const [root, ...rest] = path.split('.');
  let node: unknown = roots[root as OverrideRoot];

  for (const key of rest) {
    if (typeof node !== 'object' || node === null) return undefined;

    node = (node as Node)[key];
  }

  return typeof node === 'number' ? node : undefined;
}
