<script lang="ts">
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { f, formatSpan } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import { clock } from '$lib/clock';
  import { parseScope } from '$data/upgrades';
  import type { Listener } from '$lib/emission';
  import type Building from '$lib/buildings/base.svelte';

  import { aim } from '$lib/aim';
  import { spotlight } from '$lib/spotlight.svelte';
  import { harness } from '$lib/harness.svelte';
  import { rig } from '$lib/harness-visuals.svelte';
  import planetTexts from '$data/planets-texts';

  import { Section } from '$ui';
  import { HarvestVerb } from '$features/harvest';
  import PlanetStage from '../PlanetStage.svelte';
  import SplitControl from '../refinery/SplitControl.svelte';
  import { STAGE_WIDTH } from '../planet-viewport';
  import CohortTable from './CohortTable.svelte';
  import AimSection from './AimSection.svelte';
  import AnchorPanel from './AnchorPanel.svelte';
  import AnchorVerb from './AnchorVerb.svelte';
  import DemandNote from './DemandNote.svelte';
  import WaveStrip from './WaveStrip.svelte';
  import { extended } from './extended.svelte';
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
   * And which of them are being pointed at, so the world draws that orbit — the
   * one line between a row of figures and the clump of dots it is about.
   *
   * A row of booleans rather than the one hovered id, because `spotlight` fans
   * out: an upgrade scoped to every cohort lights every row, and every band
   * should ring with them.
   */
  const litPerCohort = $derived(cohorts.map((cohort) => spotlight.isLit('cohort', cohort.id)));

  /**
   * And how long one life takes in each, in seconds — the band turns at the pace
   * the row is printing, so a quick cohort is a quick lane and a tier that halves
   * a clock is seen out on the world rather than only in a figure.
   *
   * `duration` and not the raw ladder, so every modifier is in it. Past the
   * stream floor the clock stops shortening and the levels buy payout instead,
   * so a streaming band levels off at its top speed — which is the truth.
   */
  const pacePerCohort = $derived(cohorts.map((cohort) => cohort.duration / 1000));

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

  /**
   * And how many souls each has taken on. The ring flashes on the rise, so a
   * band's lane answers the purchase that filled it.
   *
   * On `add` rather than on the purchase call, because `add` is where a cohort
   * actually grows however it was reached — and a restore does not go through it,
   * so loading a save does not open with eight rings flashing at once.
   *
   * One rise per gesture: a buy of ten is one `add` of ten, and ten flashes of
   * the same circle would be one flash that took ten times as long to leave.
   */
  let boughtPerCohort = $state<number[]>([]);

  $effect(() => {
    const offs = cohorts.map((cohort, row) => {
      const onadd: Listener = () => {
        boughtPerCohort[row] = (boughtPerCohort[row] ?? 0) + 1;
      };

      BuildingManager.addListener(cohort.id, 'add', onadd);

      return () => BuildingManager.removeListener(cohort.id, 'add', onadd);
    });

    return () => offs.forEach((off) => off());
  });

  const planet = $derived(PlanetManager.getActive());

  const planetName = $derived(planet ? planetTexts[planet.id]?.title ?? planet.id : '');

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

  /**
   * The re-aim penalty in the strip's own units. `progress` counts phases from
   * arrival and the strip draws one age, so the age's own start is the offset.
   * A mark past the right edge wraps to the left rather than hiding: the next
   * age runs the same phases in the same order, so the wrapped x is the phase
   * the penalty really ends in. Hiding it made aiming late in an age show
   * nothing at all, which is when the deadline matters most.
   */
  const ageStart = $derived(planet ? planet.agesLived * planet.phasesPerAge : 0);

  const settleAt = $derived.by(() => {
    const end = aim.reaimEndsAt;
    if (!planet || end === undefined) return undefined;

    return ((end - ageStart) / planet.phasesPerAge) % 1;
  });

  /** Off the playhead rather than off `progress`, so the two step together. */
  const draftAt = $derived.by(() => {
    if (!planet || !aim.isPending) return undefined;

    return (planet.position + aim.draftPhases / planet.phasesPerAge) % 1;
  });

  /**
   * Which row the pointer is on, if it is on one. The rail's own hovers come
   * down the same channel, so the fan-out bucket and every other scope answer
   * nothing here — this wants one cohort or none.
   */
  const pointed = $derived.by(() => {
    if (!spotlight.target) return undefined;

    const scope = parseScope(spotlight.target);
    if (scope.kind !== 'cohort' || !scope.entity) return undefined;

    return BuildingManager.getBuilding(scope.entity);
  });

  /**
   * Where that row's life lands, on the strip's own axis — the row says how long
   * is left and the strip says what the world will be doing when it does, which
   * is the half the row cannot answer.
   *
   * Only in the extended register: it is a reading about one row, and the strip
   * is the far end of the question the derivation panel is already answering.
   *
   * The mark stands still. `remaining` falls at exactly the rate `position`
   * climbs, so the sum holds until the cohort re-arms — what makes it re-read at
   * all is `position` ticking, which is also what keeps `clock.now()` fresh.
   *
   * A life longer than an age wraps rather than hiding, for `settleAt`'s reason.
   *
   * ⚠ An idle row is asked the same question, not refused it. A cohort without a
   * clerk stands still between sends, and the rungs that stand still longest are
   * exactly the ones whose landing is worth looking up — so a row with nothing in
   * flight is marked a whole life out, which is where a life sent now would land.
   * Owning none is the only thing that has no answer.
   */
  const yieldAt = $derived.by(() => {
    if (!extended.active || !planet || !pointed) return undefined;
    if (pointed.isStreaming || !pointed.count) return undefined;

    const remaining = pointed.isInProgress
      ? Math.max(0, pointed.nextAt - clock.now())
      : pointed.duration;

    return (planet.position + remaining / planet.phaseDuration / planet.phasesPerAge) % 1;
  });

  /** Instant, always — the press has no clock of its own. See `buildings.ts`. */
  function onclickaction() {
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

  {#snippet planetBody()}
    {#if progression.isRevealed('details.disc') && planet}
      <PlanetStage
        id={planet.id}
        cohorts={soulsPerCohort}
        paid={paidPerCohort}
        streaming={streamingPerCohort}
        lit={litPerCohort}
        bought={boughtPerCohort}
        pace={pacePerCohort}
        {clickActionVerb}
        {clickActionSub}
        hasCaption={!isFramed}
        {onclickaction}
        {yields}
        yieldValue={isAnchoring ? 0 : clickYield}
        anchors={hasField ? rig.anchors : undefined}
        anchored={hasField ? harness.anchored : undefined}
        facesSite={isAnchoring}
        harness={hasField ? rig.harness : undefined}
        riders={hasField ? harness.riders : undefined}
        lines={hasField ? harness.lineBands : undefined}
        working={hasField ? harness.workers : undefined}
        pressValue={isAnchoring ? harness.clickMs : undefined}
        pressFormat={seconds}
      />
    {/if}

    {#if progression.isRevealed('details.wave') && planet}
      <WaveStrip
        {phases}
        current={planet.phase}
        position={planet.position}
        {settleAt}
        {draftAt}
        {yieldAt}
        agesLived={planet.agesLived}
        phaseMs={planet.phaseDuration}
        remainingMs={planet.phaseRemaining}
      />

      <!-- Under the clock it drains on, so every rate sits at a column's foot. -->
      <DemandNote {planet} isSpread />
    {/if}
  {/snippet}

  <div
    class={isFramed ? 'planet' : 'viewport'}
    style:max-width={isFramed ? undefined : `${STAGE_WIDTH}px`}
  >
    <!-- The header rides in with the frame — the prelude column stays the
         same borderless, labelless block it always was. -->
    {#if isFramed}
      <Section label={planetName || 'Planet'} className="planet-head">
        <!-- The press's verb heads the stage it is pressed on, off the swarm.
             The prelude has no header, so there it stays on the stage. -->
        {#snippet aside()}
          {#if progression.isRevealed('details.disc') && planet}
            <span class="press">
              <span class={['press-verb', { lit: spotlight.isLit('building', 'main') }]}>{clickActionVerb}</span>
              · <span class="num">{clickActionSub}</span>
            </span>
          {/if}
        {/snippet}
        <!-- The anchor rides the viewport's own corner: the offer is made by
             the world you are looking at, so it is drawn on it. -->
        <div class="staged">
          {@render planetBody()}
          <AnchorVerb />
        </div>

        <!-- The door out, at the foot of the world it leads away from. Inside
             the section so it takes the same padding the stage does, and in its
             own box so it can be pushed down rather than left to trail the wave
             strip by a gap. -->
        <div class="action">
          <HarvestVerb id={PlanetManager.selected} />
        </div>
      </Section>
    {:else}
      {@render planetBody()}
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

  /* Padding and gap now live on the nested Section, so the framed column
     itself is just the border and the stretch. */
  .planet {
    display: flex;
    flex-direction: column;
    border-right: var(--rule-card);
    min-width: 0;
  }

  /* The column's slack handed across the component seam — the head Section is
     this column's only child, so without this it hugs the stage and the verb
     below has nothing to be pushed into. Mirrors Overview's `.detail`. */
  .planet > :global(.section) {
    flex: 1;
    min-height: 0;
  }

  /* The stage and its strip, boxed so the anchor verb has a corner to pin to.
     Carries the Section's own gap, which it took over by wrapping them. */
  .staged {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }

  .action {
    display: flex;
    flex-direction: column;
    margin-top: auto;
  }

  .press-verb {
    font-weight: 600;
    color: var(--ink-900);
  }

  /* The press has no row to tint, so the spotlight is a chip around its verb. */
  .press-verb.lit {
    background-color: var(--surface-alt);
    margin-inline: -4px;
    padding-inline: 4px;
  }

  .cohort {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
