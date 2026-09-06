import { untrack } from 'svelte';
import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
import { beats, createTriggerContext, milestones, progression } from '$lib/progression';
import { refinery } from '$lib/refinery.svelte';
import { nav } from '$lib/nav.svelte';
import { harness } from '$lib/harness.svelte';
import { sound } from '$lib/sound.svelte';
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

/** The wave is felt here long before beat 6 draws it. */
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

/**
 * The same clock rule as the refinery's, plus the hand. Paying into anchoring
 * off the click's existing `action` event keeps the press to one verb — you
 * incarnate, and on a world still being anchored that also helps get it down.
 */
function watchHarness() {
  // Bound once, so the teardown hands back the reference it registered.
  const placeByHand = () => harness.placeByHand();

  $effect(() => {
    if (!progression.runs('anchoring')) return;

    harness.start();
    BuildingManager.addListener('main', 'action', placeByHand);

    return () => BuildingManager.removeListener('main', 'action', placeByHand);
  });
}

const sounded = new Set<string>();

/**
 * Souls sound on `'add'`, cohort by cohort as each unlocks — it carries how
 * many arrived in that one purchase, so a x10 buy bursts instead of clicking
 * once. Fires on a free grant too (an upgrade's `acquire`), which is correct:
 * this is souls arriving, not money spent.
 */
function watchSound() {
  sound.warm();

  $effect(() => {
    for (const id of BuildingManager.cohorts) {
      if (sounded.has(id)) continue;

      BuildingManager.addListener(id, 'add', (detail) => {
        sound.play('soul.purchase', Number(detail?.added ?? 1));
      });
      sounded.add(id);
    }
  });
}

/** Walking in and out of the room. Just long enough to not click — the tab is
 *  switched, not eased into. */
const ENTER_FADE_MS = 50;

/**
 * The refinery is somewhere you go and look at, so all of it — bed, hit and the
 * staffing stingers — lives and dies with the tab. Off it the machine is silent.
 *
 * The drone is held and crossfaded to itself on every cycle, drawing from the
 * tier the interval names at that moment, so the machine tightening is heard as
 * the bed changing and needs no code of its own. The hit rides `action` and only
 * sounds on a pull that paired — the stall is deliberately a gap.
 */
function watchRefinerySound() {
  const crossfade = () => sound.sustain('refinery.drone', { spanMs: refinery.interval });
  const strike = (detail?: Record<string, unknown>) => {
    if (Number(detail?.paired ?? 0) > 0) sound.play('refinery.hit');
  };

  let wasOpen = false;
  let wasStaffed = false;

  $effect(() => {
    const isOpen = nav.active === 'refinery' && progression.runs('refining');
    const isStaffed = refinery.workers > 0;

    // Staffing that flips while you are away is just how the room sounds when
    // you walk in. The stingers report a change you were there for.
    if (wasOpen && isOpen && isStaffed !== wasStaffed) {
      sound.play(isStaffed ? 'refinery.spinup' : 'refinery.spindown');
    }

    wasOpen = isOpen;
    wasStaffed = isStaffed;

    if (!isOpen || !isStaffed) {
      sound.release('refinery.drone', ENTER_FADE_MS);
      return;
    }

    // Walking in sounds now rather than next cycle. Untracked because reading
    // the interval here would re-run this on every tier change and churn the
    // listeners — the crossfade is what watches it.
    untrack(() => {
      sound.sustain('refinery.drone', { spanMs: refinery.interval, fadeMs: ENTER_FADE_MS });
    });

    refinery.addListener('queue', crossfade);
    refinery.addListener('action', strike);

    return () => {
      refinery.removeListener('queue', crossfade);
      refinery.removeListener('action', strike);
    };
  });
}

export function wire() {
  watchExperience();
  watchWave();
  watchBeats();
  watchMoments();
  watchBuildings();
  watchRefinery();
  watchHarness();
  watchSound();
  watchRefinerySound();
}
