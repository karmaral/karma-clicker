import { ChevronsUp, HourglassEmpty, Refresh } from '@steeze-ui/tabler-icons';
import type { IconSource } from '@steeze-ui/svelte-icon';
import type { Upgrade } from './upgrades.svelte';

/** The chip's whole type reading: what it does, not what it is called. */
export function iconFor({ effect }: Pick<Upgrade, 'effect'>): IconSource {
  const list = Array.isArray(effect) ? effect : effect ? [effect] : [];

  if (list.includes('autonomy')) return Refresh;
  if (list.some((e) => typeof e !== 'string' && e.stat === 'duration')) return HourglassEmpty;

  return ChevronsUp;
}
