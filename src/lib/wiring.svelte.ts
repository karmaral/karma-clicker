import { BuildingManager, ResourceManager } from '$lib/managers';
import { pulse } from '$lib/loop';
import { log } from '$lib/log.svelte';
import { formatNumber } from '$lib/utils';

const attached = new Set<string>();

/** Pulses when yields land, not when they are queued. */
function watchBuildings() {
  $effect(() => {
    for (const id of BuildingManager.buildings) {
      if (attached.has(id)) continue;

      BuildingManager.addListener(id, 'action', pulse);
      attached.add(id);
    }
  });
}

/**
 * Karma as residue of incarnating. Carried over from MainAction — still a side
 * effect registered nowhere in the data, and it is what makes beat 2 fire.
 */
function watchExperience() {
  ResourceManager.addListener('experience', 'add', (detail) => {
    const added = Number(detail?.added ?? 0);
    if (added <= 0) return;

    ResourceManager.add('karma_positive', added / 3);
    log.add(`A life ended. +${formatNumber(added)} experience.`);
  });
}

export function wire() {
  watchExperience();
  watchBuildings();
}
