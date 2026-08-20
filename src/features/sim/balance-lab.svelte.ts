/**
 * The lab's working copy of every tunable figure. Only what has moved is held,
 * so `print` can emit the blocks you actually touched and nothing else.
 *
 * The data files themselves are never written to here — a run mutates its own
 * worker's module graph, which is what keeps the page's defaults pristine.
 */

import { DATA_ROOTS, DEFAULTS } from '$lib/sim/params';

/** Project style: an integer of five figures or more is grouped. */
function printNumber(value: number) {
  if (!Number.isInteger(value) || Math.abs(value) < 10_000) return String(value);

  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '_');
}

function printValue(value: unknown, indent: string): string {
  if (typeof value === 'number') return printNumber(value);
  if (typeof value === 'string') return `'${value}'`;
  if (Array.isArray(value)) return `[${value.map((item) => printValue(item, indent)).join(', ')}]`;

  if (value && typeof value === 'object') {
    const body = Object.entries(value)
      .map(([key, inner]) => `${indent}  ${key}: ${printValue(inner, `${indent}  `)},`)
      .join('\n');

    return `{\n${body}\n${indent}}`;
  }

  return String(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function write(node: Record<string, unknown>, keys: string[], value: number) {
  let cursor = node;

  for (const key of keys.slice(0, -1)) {
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys[keys.length - 1]] = value;
}

function createBalanceLab() {
  const changed = $state<Record<string, number>>({});

  function value(key: string) {
    return changed[key] ?? DEFAULTS[key] ?? 0;
  }

  function set(key: string, next: number) {
    if (!Number.isFinite(next)) return;

    if (next === DEFAULTS[key]) delete changed[key];
    else changed[key] = next;
  }

  function reset(key: string) {
    delete changed[key];
  }

  function revert() {
    for (const key of Object.keys(changed)) delete changed[key];
  }

  /**
   * One block per entity you moved something in, as TS to paste over the block
   * it came from. Comments are lost — the file's are the ones that matter, so a
   * paste is a figure swap, not a replacement of the authoring around it.
   */
  function print() {
    const touched = new Map<string, string[]>();

    for (const key of Object.keys(changed)) {
      const parts = key.split('.');
      const owner = parts.slice(0, 2).join('.');

      touched.set(owner, [...(touched.get(owner) ?? []), key]);
    }

    if (!touched.size) return '// nothing moved';

    return [...touched]
      .map(([owner, keys]) => {
        const [root, entity] = owner.split('.');
        const source = cloneOwner(root, entity);
        if (!source) return '';

        for (const key of keys) {
          write(source, key.split('.').slice(2), changed[key]);
        }

        // `balance.ts` writes bare keys; the two entity files quote theirs.
        const name = root === 'balance' ? entity : `'${entity}'`;

        return `${name}: ${printValue(source, '')},`;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  function cloneOwner(root: string, entity: string) {
    const node = (DATA_ROOTS as Record<string, Record<string, unknown>>)[root]?.[entity];

    return node && typeof node === 'object' ? clone(node) as Record<string, unknown> : undefined;
  }

  /** One entity with the sliders applied — what a run would see, before running it. */
  function entity<T>(root: string, name: string) {
    const source = cloneOwner(root, name);
    if (!source) return undefined;

    for (const key of Object.keys(changed)) {
      const parts = key.split('.');
      if (parts[0] !== root || parts[1] !== name) continue;

      write(source, parts.slice(2), changed[key]);
    }

    return source as T;
  }

  return {
    get overrides() { return { ...changed }; },
    entity,
    get touched() { return Object.keys(changed).length; },
    isChanged: (key: string) => key in changed,
    value,
    set,
    reset,
    revert,
    print,
  };
}

export const balanceLab = createBalanceLab();
