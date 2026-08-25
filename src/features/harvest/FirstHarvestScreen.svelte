<script lang="ts">
  /**
   * A takeover, not a fourth tab — but of the **Overview**, not of the frame.
   * The header and the rail stay: they are how you get back out, and a screen
   * with nothing lit in the header above it is a room with no door. The
   * Overview's tab stays lit because this is the Overview, holding the one
   * decision it can lead to.
   *
   * Its home there is **provisional** — whether the harvest belongs to the
   * Overview or to Details is not settled, which is why the flag that opens it
   * lives in `nav` rather than in this feature or that screen.
   *
   * The layout is a **shoulder on each side and the controls down the middle**,
   * on a world drawn across the whole block and held above them. The three
   * float on that world with no ground of their own — the panels are the only
   * opaque things here — so the swarm strays out *behind* what you are reading
   * rather than into a margin. Top to bottom the middle is world, then split,
   * then verb: the order the decision is made in.
   *
   * **`Not yet` stays** even with the tabs back. It is redundant with them, and
   * it is the only thing on the screen that says leaving is free.
   *
   * One verb, and the split that arms it. Everything here arrives at once, which
   * is why there is one reveal key and no `{#if}` inside.
   */
  import { Button } from '$ui';
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { getFirstHarvestAlignment } from '$lib/excess';
  import { FIRST_HARVEST_ALIGNMENT_LABELS, getFirstHarvestConditionLabel } from '$lib/labels';
  import { pulse } from '$lib/loop';
  import AlignmentPanel from './AlignmentPanel.svelte';
  import HarvestStage from './HarvestStage.svelte';
  import MergeSplit from './MergeSplit.svelte';
  import OutputPanel from './OutputPanel.svelte';
  import planetTexts from '$data/planets-texts';

  interface Props {
    onclose?: () => void;
  }

  let { onclose }: Props = $props();

  /** One global fraction across every cohort — you never choose which flavour goes. */
  let mergedPercent = $state(50);

  const planet = $derived(PlanetManager.getActive());
  const name = $derived(planetTexts[planet?.id ?? '']?.title ?? '—');

  const souls = $derived(BuildingManager.countSouls());

  /**
   * The world's toll is where the slider starts, not something to fail against —
   * you cannot dial below it. It falls as the population grows, so the handle is
   * held up to it rather than clamped down to it.
   */
  const floorPercent = $derived(BuildingManager.findMergeFloor(planet?.mergeMinimum ?? 0));
  const percent = $derived(Math.max(mergedPercent, floorPercent));

  const mergeFraction = $derived(percent / 100);
  const merged = $derived(BuildingManager.countMergeable(mergeFraction));
  const kept = $derived(souls - merged);

  /** The same rows the cohort table draws, as counts — one band per cohort. */
  const soulsPerCohort = $derived.by(() => {
    const counts: number[] = [];

    for (const id of BuildingManager.buildings) {
      const cohort = BuildingManager.getBuilding(id);
      if (!cohort || cohort.data.role === 'click') continue;

      counts.push(cohort.count);
    }

    return counts;
  });

  /**
   * Kept as the reading rather than as its label, because the world draws it
   * too: the stage's core carries the same figure as a lean, and the verb's
   * subtitle says it in words. One read, two marks.
   */
  const alignment = $derived(getFirstHarvestAlignment());
  const alignmentLabel = $derived(FIRST_HARVEST_ALIGNMENT_LABELS[alignment]);

  /**
   * You cannot arrive here unready — the beat fires on the world being
   * harvestable and the Overview's verb is dead until it is. But `excessGate`
   * reads a live figure, so readiness can *lapse* under you while the screen is
   * open, and that is what this says. Empty is the normal state of the screen.
   */
  const lapsed = $derived(
    (planet?.unmetFirstHarvestConditions ?? []).map((condition) =>
      getFirstHarvestConditionLabel(condition, planet?.data.firstHarvest[condition] ?? 0),
    ),
  );

  function completeFirstHarvest() {
    PlanetManager.completeFirstHarvest(mergeFraction);
    pulse();
    onclose?.();
  }
</script>

<div class="first-harvest">
  {#if planet}
    <HarvestStage
      id={planet.id}
      cohorts={soulsPerCohort}
      merge={mergeFraction}
      {alignment}
    />
  {/if}

  <div class="decision">
    <div class="shoulder">
      {#if planet}
        <AlignmentPanel yields={planet.data.harvest?.yields ?? {}} />
      {/if}
    </div>

    <div class="middle">
      {#if planet}
        <MergeSplit
          staying={merged}
          returning={kept}
          value={mergeFraction}
          floor={floorPercent / 100}
          minimum={planet.mergeMinimum}
          merge={planet.data.harvest ?? {}}
          onchange={(share) => (mergedPercent = share * 100)}
        />
      {/if}

      <div class="verb">
        <Button
          layout="spread"
          label="Harvest {name}"
          sub={alignmentLabel}
          disabled={!planet?.isFirstHarvestReady}
          onclick={completeFirstHarvest}
        />

        <div class="warning">
          <span class="note">
            {#if lapsed.length}
              Needs {lapsed.join(' · ')}
            {:else}
              The first harvest cannot be reversed. Departure is final.
            {/if}
          </span>
          <button class="quit" onclick={() => onclose?.()}>Not yet</button>
        </div>
      </div>
    </div>

    <div class="shoulder right">
      {#if planet}
        <OutputPanel {planet} {merged} />
      {/if}
    </div>
  </div>
</div>

<style>
  .first-harvest {
    position: relative;
    min-width: 0;
  }

  .decision {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 620px) minmax(0, 1fr);
    align-items: start;
    gap: var(--sp-5);
    padding: var(--sp-5) var(--sp-4);
    min-height: 680px;
  }

  .shoulder {
    min-width: 0;
    width: 100%;
    max-width: 380px;
  }

  .right {
    justify-self: end;
  }

  .middle {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--sp-5);
    min-width: 0;
    height: 100%;
  }

  .verb {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: min(100%, 545px);
    margin-inline: auto;

    & :global(.btn) {
      padding-block: var(--sp-4);

    }
  }

  .warning {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: 0 var(--sp-2) var(--sp-3);
  }

  .note {
    flex: 1;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    font-weight: 500;
  }

  .quit {
    padding: 0;
    border: none;
    background: none;
    font-size: var(--fs-sm);
    color: var(--ink-900);
    font-weight: 500;
    text-decoration: underline;
  }
</style>
