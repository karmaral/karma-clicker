<script lang="ts">
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { f, formatSpan } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import type { Listener } from '$lib/emission';
  import type Building from '$lib/buildings/base.svelte';

  import { harness } from '$lib/harness.svelte';
  import harnessVisuals from '$data/harness-visuals';

  import PlanetStage from '../PlanetStage.svelte';
  import SplitControl from '../refinery/SplitControl.svelte';
  import { STAGE_WIDTH } from '../planet-viewport';
  import CohortTable from './CohortTable.svelte';
  import AimSection from './AimSection.svelte';
  import AnchorPanel from './AnchorPanel.svelte';
  import WaveStrip from './WaveStrip.svelte';
  import type { Phase, PurchaseMode } from './types';

  let purchaseMode: PurchaseMode = $state('1');

  const CLICK = 'main';

  const click = $derived(BuildingManager.getBuilding(CLICK));

  /**
   * The payout, not the production: what the harness carries multiplies the press
   * and the button has to say the figure the press will actually pay. `payout`
   * already reads 0 while anchoring, which is what `isAnchoring` overrides below.
   */
  const clickYield = $derived(click?.payout('experience') ?? 0);

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

  /**
   * And which of them have gone from a clock to a rate. The swarm needs it for
   * one thing: a streaming cohort's payouts land on the emitter's tick rather
   * than on its own lives, so its band is struck on a fixed rhythm instead of
   * on `paidPerCohort`. See `SoulSwarm`.
   */
  const streamingPerCohort = $derived(cohorts.map((cohort) => cohort.isStreaming));

  /**
   * How many times each cohort has paid out. The swarm strikes on the rise, so
   * a band throws its bolts when that cohort actually yields — the same reading
   * `yields` gives the click's spark, one row per cohort instead of one figure.
   *
   * A count and not a timestamp because the world's clock ticks in quarter
   * seconds; see `createBoltBeats`.
   */
  let paidPerCohort = $state<number[]>([]);

  $effect(() => {
    const offs = cohorts.map((cohort, row) => {
      const onaction: Listener = () => {
        paidPerCohort[row] = (paidPerCohort[row] ?? 0) + 1;
      };

      BuildingManager.addListener(cohort.id, 'action', onaction);

      return () => BuildingManager.removeListener(cohort.id, 'action', onaction);
    });

    return () => offs.forEach((off) => off());
  });

  const planet = $derived(PlanetManager.getActive());

  /** The centered, borderless prelude layout recedes once the header & rail land. */
  const isFramed = $derived(progression.isRevealed('frame.header'));

  /**
   * The roster claims its column a beat early: the first cohort arrives before
   * the frame does, and it should land where it will live rather than under the
   * disc for one beat. Still borderless — the rule comes with the frame.
   */
  const isColumns = $derived(isFramed || progression.isRevealed('details.cohortTable'));

  const phases = $derived<Phase[]>(
    planet?.phases.map((phase) => ({
      kind: phase.dense ? 'dense' : 'light',
      at: `closes at ${formatSpan(phase.at)}`,
    })) ?? [],
  );

  function onclickaction() {
    if (click?.isInProgress) return;
    click?.queueAction();
  }

  let yields = $state(0);

  /**
   * Sparks the ground on the payout, not the press — see `PlanetScene`. And not
   * at all while the world is being anchored: a spark is where a soul landed, so
   * a press that incarnates nobody should leave nothing on the ground.
   */
  $effect(() => {
    const onaction: Listener = () => {
      if (isAnchoring) return;

      yields++;
    };

    BuildingManager.addListener(CLICK, 'action', onaction);

    return () => BuildingManager.removeListener(CLICK, 'action', onaction);
  });

  /** The bar sweeps on the click's own clock; mirrors CohortRow's sweepOf. */
  function sweepOf(id: string) {
    return (fn: Listener) => {
      BuildingManager.addListener(id, 'queue', fn);

      return () => BuildingManager.removeListener(id, 'queue', fn);
    };
  }

  /**
   * The field is drawn from the beat on, anchored or not: a finished harness
   * staying on the world is the payoff made visible. Only the panel and the
   * press are gated on the phase still being underway.
   */
  const hasField = $derived(progression.isRevealed('details.field'));
  const isAnchoring = $derived(hasField && harness.isPlacing);

  const seconds = (ms: number) => `−${(ms / 1000).toFixed(2)}s`;

  function purchase(id: string, quantity: number) {
    BuildingManager.purchase(id, quantity);
    pulse();
  }

  let clickActionVerb: string = $derived.by(() => {
    return isAnchoring ? 'Anchor the harness' : 'Incarnate';
  });

  let clickActionSub: string = $derived.by(() => {
    if (isAnchoring) {
      return `${seconds(harness.clickMs)} anchoring`;
    }

    return `+${f(clickYield)} experience`;
  });
  

</script>

<div class="details view-layout" class:stacked={!isColumns}>

  <div 
    class={isFramed ? 'planet' : 'viewport'} 
    style:max-width={isFramed ? undefined : `${STAGE_WIDTH}px`}
  >
    {#if progression.isRevealed('details.disc') && planet}
      <PlanetStage
        id={planet.id}
        cohorts={soulsPerCohort}
        paid={paidPerCohort}
        streaming={streamingPerCohort}
        {clickActionVerb}
        {clickActionSub}
        duration={click?.duration ?? 0}
        isInProgress={click?.isInProgress ?? false}
        subscribe={sweepOf(CLICK)}
        {onclickaction}
        {yields}
        yieldValue={isAnchoring ? 0 : clickYield}
        anchors={hasField ? harnessVisuals.anchors : undefined}
        anchored={hasField ? planet.anchored : undefined}
        harness={hasField ? harnessVisuals.harness : undefined}
        riders={hasField ? harness.riders : undefined}
        pressValue={isAnchoring ? harness.clickMs : undefined}
        pressFormat={seconds}
      />
    {/if}

    {#if progression.isRevealed('details.wave') && planet}
      <WaveStrip {phases} current={planet.phase} position={planet.position} />
    {/if}
  </div>

  <div class="cohort">
    <!-- The roster is not the decision while the harness is going down, so it
         stands aside for the field rather than sitting under it. -->
    {#if isAnchoring && planet}
      <AnchorPanel {planet} />
    {:else}
      {#if progression.isRevealed('details.cohortTable')}
        <CohortTable
          {cohorts}
          {purchaseMode}
          showRates={progression.isRevealed('details.status')}
          onpurchasemode={(m) => (purchaseMode = m)}
          onpurchase={purchase}
        />
      {/if}

      {#if progression.isRevealed('details.aimGlobal')}
        <AimSection />
      {/if}
    {/if}

    <!-- Only while there is a job to split against. Off-phase the reserved
         souls have nowhere to go from here — the refinery keeps its own — so a
         lever left on screen would be one you can move and cannot spend. -->
    {#if progression.isRevealed('details.split') && isAnchoring}
      <SplitControl job="anchoring" />
    {/if}
  </div>
</div>

<style>
  .details.stacked {
    display: flex;
    flex-direction: column;
  }

  /* Docks the wave strip to the viewport above it so the two read as one block. */
  .viewport {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: 100%;
    margin-inline: auto;
  }

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
