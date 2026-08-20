<script lang="ts">
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { getPhaseLabel } from '$lib/labels';
  import { f } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import type Building from '$lib/buildings/base.svelte';

  import PlanetStage from '../PlanetStage.svelte';
  import Log from '../Log.svelte';
  import RevealStub from '../RevealStub.svelte';
  import SplitControl from '../refinery/SplitControl.svelte';
  import CohortTable from './CohortTable.svelte';
  import AimSection from './AimSection.svelte';
  import PlanetSection from './PlanetSection.svelte';
  import RateStatus from './RateStatus.svelte';
  import type { Phase, PurchaseMode } from './types';
  import planetTexts from '$data/planets-texts';

  let purchaseMode: PurchaseMode = $state('1');

  const CLICK = 'main';

  const click = $derived(BuildingManager.getBuilding(CLICK));
  const clickYield = $derived(click?.production.experience ?? 0);

  const cohorts = $derived.by(() => {
    const rows: Building[] = [];
    for (const id of BuildingManager.buildings) {
      const cohort = BuildingManager.getBuilding(id);
      if (!cohort || cohort.data.role === 'click') continue;

      rows.push(cohort);
    }

    return rows;
  });

  /** The same rows as counts — the swarm draws one band per cohort. */
  const soulsPerCohort = $derived(cohorts.map((cohort) => cohort.count));

  const planet = $derived(PlanetManager.getActive());

  const phases = $derived<Phase[]>(
    planet?.phases.map((phase) => ({
      kind: phase.dense ? 'dense' : 'light',
      at: `${f(phase.at)} xp`,
    })) ?? [],
  );

  const waveStatus = $derived(
    planet ? getPhaseLabel(planet.phase, planet.phasesPerAge) : '',
  );

  function incarnate() {
    click?.queueAction();
  }

  function purchase(id: string, quantity: number) {
    BuildingManager.purchase(id, quantity);
    pulse();
  }
</script>

<div class="detail view-layout">

  <div class="planet">
    {#if progression.isRevealed('detail.disc') && planet}
      <PlanetStage
        id={planet.id}
        cohorts={soulsPerCohort}
        sub="+{f(clickYield)} experience"
        onclickaction={incarnate}
      />
    {/if}

    {#if progression.isRevealed('detail.status')}
      <RateStatus />
    {/if}

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

  <div class="cohort">
    {#if progression.isRevealed('detail.cohortTable')}
      <CohortTable
        {cohorts}
        {purchaseMode}
        showAim={progression.isRevealed('detail.aimPerRow')}
        onpurchasemode={(m) => (purchaseMode = m)}
        onpurchase={purchase}
      />
    {/if}

    {#if progression.isRevealed('detail.aimGlobal')}
      <AimSection />
    {/if}

    {#if progression.isRevealed('detail.split')}
      <SplitControl />
    {/if}
    <RevealStub name="detail.field" note="the anchoring field — Phase D" />
  </div>



</div>

<style>
  .planet {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    padding: 0 var(--sp-4);
    border-right: var(--rule-card);
    min-width: 0;
  }

  .cohort {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
