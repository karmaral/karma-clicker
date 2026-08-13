import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
import { beats, createTriggerContext, milestones, progression } from '$lib/progression';
import { refinery } from '$lib/refinery.svelte';
import { pulse } from '$lib/loop';
import { log } from '$lib/log.svelte';
import texts from '$data/log-texts';
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

/** Every credit, souls included — they count into one row rather than push. */
function watchExperience() {
  ResourceManager.addListener('experience', 'add', (detail) => {
    const added = Number(detail?.added ?? 0);
    if (added <= 0) return;

    log.accumulate('incarnation', texts.ambient.incarnation);
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
    log.add(planet.isDense ? texts.ambient.dense(name) : texts.ambient.light(name));
  });
}

/** Reads the counter, not the trigger, so progression keeps the API it has. */
function watchBeats() {
  let previous = progression.beat;

  $effect(() => {
    const reached = progression.beat;
    // A dev scrub down rewinds the mark; `once` keeps the climb back up quiet.
    if (reached > previous) {
      for (let i = previous; i < reached; i++) {
        const text = texts.beats[beats[i].id];
        if (text) log.once(`beat:${beats[i].id}`, text);
      }
    }

    previous = reached;
  });
}

/** Firsts no beat covers. Cheap predicates, same as the beat triggers. */
function watchMoments() {
  const ctx = createTriggerContext();

  $effect(() => {
    for (const moment of milestones) {
      if (!moment.when(ctx)) continue;

      const text = texts.moments[moment.id];
      if (text) log.once(`moment:${moment.id}`, text);
    }
  });
}

/** The clock starts with the system, not with the tab that draws it. */
function watchRefinery() {
  $effect(() => {
    if (!progression.runs('refining')) return;

    refinery.start();
  });
}

export function wire() {
  watchExperience();
  watchWave();
  watchBeats();
  watchMoments();
  watchBuildings();
  watchRefinery();
}
