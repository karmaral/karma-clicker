import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
import { pulse } from '$lib/loop';
import { log } from '$lib/log.svelte';
import { formatNumber } from '$lib/utils';
import planetTexts from '$data/planets-texts';

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

function watchExperience() {
  ResourceManager.addListener('experience', 'add', (detail) => {
    const added = Number(detail?.added ?? 0);
    if (added <= 0) return;

    log.add(`A life ended. +${formatNumber(added)} experience.`);
  });
}

/** The wave is felt here long before beat 5 draws it. */
function watchWave() {
  let previous = PlanetManager.getActive()?.isDense;

  $effect(() => {
    const planet = PlanetManager.getActive();
    if (!planet || planet.isDense === previous) return;

    previous = planet.isDense;
    const name = planetTexts[planet.id]?.title ?? planet.id;
    log.add(
      planet.isDense
        ? `${name} turned dense. Lives are going worse than they were.`
        : `${name} turned light. Lives are going better than they were.`,
    );
  });
}

export function wire() {
  watchExperience();
  watchWave();
  watchBuildings();
}
