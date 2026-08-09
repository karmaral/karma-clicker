<script lang="ts">
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { formatNumber } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import type Building from '$lib/buildings/base.svelte';
  import Disc from '../Disc.svelte';
  import Log from '../Log.svelte';
  import RevealStub from '../RevealStub.svelte';
  import CohortTable from './CohortTable.svelte';
  import PlanetSection from './PlanetSection.svelte';
  import type { Phase } from './types';
  import planetTexts from '$data/planets-texts';

  const CLICK = 'main_action';

  const click = $derived(BuildingManager.getBuilding(CLICK));
  const clickYield = $derived(click?.production.experience ?? 0);

  const cohortCount = $derived(
    BuildingManager.buildings.reduce((sum, id) => {
      const cohort = BuildingManager.getBuilding(id);
      if (!cohort || cohort.data.role === 'click') return sum;

      return sum + cohort.count;
    }, 0),
  );

  const cohorts = $derived.by(() => {
    const rows: Building[] = [];
    for (const id of BuildingManager.buildings) {
      const cohort = BuildingManager.getBuilding(id);
      if (!cohort || cohort.data.role === 'click') continue;

      rows.push(cohort);
    }

    return rows;
  });

  const planet = $derived(PlanetManager.getActive());

  const phases = $derived<Phase[]>(
    planet?.phases.map((phase) => ({
      kind: phase.dense ? 'dense' : 'light',
      at: `${formatNumber(phase.at)} xp`,
    })) ?? [],
  );

  const waveStatus = $derived(
    planet ? `stage ${planet.phase + 1} of ${planet.phasesPerAge}` : '',
  );

  function incarnate() {
    click?.queueAction();
  }

  function buy(id: string) {
    BuildingManager.purchase(id, 1);
    pulse();
  }
</script>

<div class="detail">
  <div class="read">
    {#if progression.isRevealed('detail.disc')}
      <Disc
        count={cohortCount}
        sub="+{formatNumber(clickYield)} experience"
        onincarnate={incarnate}
      />
    {/if}

    <RevealStub name="detail.status" note="the per-second rate line" height="48px" />

    {#if progression.isRevealed('detail.wave') && planet}
      <PlanetSection
        name={planetTexts[planet.id]?.title ?? planet.id}
        status={waveStatus}
        {phases}
        current={planet.phase}
        position={planet.position}
      />
    {/if}

    {#if progression.isRevealed('shared.log')}
      <Log />
    {/if}
  </div>

  <div class="act">
    {#if progression.isRevealed('detail.cohortTable')}
      <CohortTable
        {cohorts}
        affordable={(id) => BuildingManager.canAfford(id, 1)}
        showAim={progression.isRevealed('detail.aimGlobal')}
        onbuy={buy}
      />
    {/if}

    <RevealStub name="detail.aimPerRow" note="per-row aim — Phase D" height="48px" />
    <RevealStub name="detail.split" note="the probe split — Phase D" />
    <RevealStub name="detail.field" note="the anchoring field — Phase D" />
  </div>
</div>

<style>
  .detail {
    display: grid;
    grid-template-columns: 5fr 7fr;
    align-items: start;
    min-width: 0;
  }

  .read {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    padding: var(--sp-5) var(--sp-4);
    border-right: var(--rule-card);
    min-width: 0;
  }

  .act {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
