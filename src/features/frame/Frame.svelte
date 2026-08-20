<script lang="ts">
  /**
   * The header is the navigation. Four blocks: a score that is not a tab, and
   * three tabs that each read what their screen acts on.
   *
   * The division the layout rests on is **bars are quantities, the meter is
   * state**. Two lengths under Details say how big each karma pile is and which
   * is bigger; the meter in the third cell says how far that difference has
   * carried you and where the door is. Nothing is drawn twice.
   */
  import { Badge, Cell, ExcessMeter, Figure, HeaderBand, Label, PolarityBars, Rail, Value } from '$ui';
  import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
  import { getExcess } from '$lib/excess';
  import { progression } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { refinery } from '$lib/refinery.svelte';
  import { aim } from '$lib/aim';
  import {
    SCREENS,
    getExcessSideLabel,
    getExcessSideNote,
    getWaveLabel,
    type ScreenName,
  } from '$lib/labels';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import planetTexts from '$data/planets-texts';
  import type { ResourceType } from '$types';
  import NavSection from './NavSection.svelte';
  import ScoreCell from './ScoreCell.svelte';
  import UpgradeRail from './UpgradeRail.svelte';

  /**
   * The score block, then the tabs in header order. The third cell's `1fr` slot
   * is held open from the first beat, so Overview inserting at beat 8 moves the
   * columns beside it and nothing else.
   */
  const SCORE_WIDTH = '214px';

  const WIDTHS: Record<ScreenName, string> = {
    detail: '520px',
    overview: '236px',
    refinery: 'minmax(0, 1fr)',
  };

  const visible = $derived(SCREENS.filter((screen) => nav.state(screen) !== 'absent'));

  const columns = $derived(
    [SCORE_WIDTH, ...visible.map((screen) => WIDTHS[screen])]
      .concat(visible.includes('refinery') ? [] : ['minmax(0, 1fr)'])
      .join(' '),
  );

  const experience = $derived(f(ResourceManager.getAmount('experience')));

  const negAmount = $derived(ResourceManager.getAmount('karma_negative'));
  const posAmount = $derived(ResourceManager.getAmount('karma_positive'));

  const posRed = $derived(ResourceManager.getAmount('red_positive'));
  const negRed = $derived(ResourceManager.getAmount('red_negative'));
  const yellow = $derived(ResourceManager.getAmount('yellow'));
  const blue = $derived(ResourceManager.getAmount('blue'));

  /** Cohorts and the worlds already left both keep earning, so each figure sums both. */
  const harvestRates = $derived(
    sumHarvestRates(
      PlanetManager.behind.map((id) => {
        const planet = PlanetManager.getPlanet(id);

        return { yields: planet.harvestYields, duration: planet.harvestDuration };
      }),
    ),
  );

  function harvestRateFor(...types: ResourceType[]) {
    return harvestRates
      .filter((rate) => types.includes(rate.type))
      .reduce((sum, rate) => sum + rate.perSecond, 0);
  }

  const showRates = $derived(progression.isRevealed('detail.status'));
  const karmaRates = $derived(BuildingManager.countKarmaPerSecondByPolarity());
  const experienceRate = $derived(
    f(BuildingManager.countExperiencePerSecond() + harvestRateFor('experience')),
  );
  const posKarmaRate = $derived(f(karmaRates.positive + harvestRateFor('karma_positive')));
  const negKarmaRate = $derived(f(karmaRates.negative + harvestRateFor('karma_negative')));

  const reading = $derived(getExcess());

  /**
   * Until tokens arrive the third section is named for the reading it carries, not
   * for the tab it becomes at beat 11 (CONTEXT v3 §3.2).
   */
  const isRefineryTab = $derived(progression.isRevealed('reading.tokens'));

  /** Both piles exist, so both bars and the matched hairline have something to say. */
  const isSplit = $derived(progression.isRevealed('reading.negKarma'));

  const planet = $derived(PlanetManager.getActive());

  /** A finished world still reads, but there is nothing left to open on it. */
  const isDetailDead = $derived(!nav.isAvailable('detail'));

  const yielding = $derived(PlanetManager.behind.length);

  const places = $derived(PlanetManager.planets.length);

  /** Where you would go next, and whether this world is done letting you. */
  const gate = $derived(PlanetManager.ahead[0]);
  const gateLabel = $derived(gate ? planetTexts[gate]?.title ?? gate : '');

  const excessGate = $derived(planet?.data.firstHarvest.excessGate);

  const matched = $derived(Math.min(negAmount, posAmount));
  const backlog = $derived(negAmount + posAmount);

  const detailFoot = $derived.by(() => {
    if (!isSplit) return 'the split arrives when there is something to hold back for';

    const parts = [`aim ${aim.detentLabel(aim.detent).toLowerCase()}`];

    if (progression.isRevealed('detail.split')) {
      const reserved = BuildingManager.countReserved();

      parts.push(`souls ${f(BuildingManager.countSouls() - reserved)} out, ${f(reserved)} in reserve`);
    }

    return parts.join(' · ');
  });

  function getSectionLabel(screen: ScreenName) {
    if (screen === 'refinery' && !isRefineryTab) return 'Excess';

    return nav.label(screen);
  }

  function getSectionNote(screen: ScreenName) {
    if (screen === 'refinery' && !isRefineryTab) return getExcessSideNote(reading);
    if (screen !== 'detail') return undefined;
    if (isDetailDead || !planet) return 'no active planet';

    return getWaveLabel(planet.phase, planet.phasesPerAge, planet.isDense);
  }

  function getSectionTone(screen: ScreenName) {
    if (screen === 'detail' && isDetailDead) return 'dead' as const;

    return nav.active === screen ? ('active' as const) : ('inactive' as const);
  }
</script>

<HeaderBand {columns}>
  <ScoreCell
    amount={experience}
    caption={showRates ? `+${experienceRate}/s` : undefined}
  />

  {#each visible as screen (screen)}
    <NavSection
      state={nav.state(screen)}
      active={nav.active === screen}
      dead={screen === 'detail' && isDetailDead}
      onselect={() => nav.to(screen)}
    >
      <Cell
        label={getSectionLabel(screen)}
        labelNote={getSectionNote(screen)}
        labelTone={getSectionTone(screen)}
        caption={screen === 'refinery' && isRefineryTab
          ? `refining ${f(refinery.clearedPerSecond)}/s · matched ${f(matched)} · backlog ${f(backlog)}`
          : undefined}
        banded
      >
        {#if screen === 'detail'}
          {#if progression.isRevealed('reading.negKarma')}
            <Value kind="neg" value={f(negAmount)} rate={showRates ? negKarmaRate : undefined} />
          {/if}
          {#if progression.isRevealed('reading.posKarma')}
            <Value kind="pos" value={f(posAmount)} rate={showRates ? posKarmaRate : undefined} />
          {/if}

        {:else if screen === 'overview'}
          <!-- Places, not experience: what Overview is a screen about. Until a
               world is behind you there is nothing yielding, so it counts itself. -->
          <Figure
            value={yielding ? `${yielding} yielding` : `${places} ${places === 1 ? 'planet' : 'planets'}`}
            size="lg"
          />

        {:else if isRefineryTab}
          <!-- One badge between two figures: red is the only token still holding
               a side, and the pair is the reading. Negative left, the order the
               detail section and the grade table both take. Empty rungs are drawn
               greyed rather than withheld, so the ladder shows its height from the
               beat that reveals it. -->
          <span class="pair">
            <Figure value={f(negRed)} size="lg" muted={!negRed} />
            <Badge kind="red-both" />
            <Figure value={f(posRed)} size="lg" muted={!posRed} />
          </span>
          <Value kind="yellow" value={f(yellow)} size="lg" muted={!yellow} />
          <Value kind="blue" value={f(blue)} size="lg" muted={!blue} />

        {:else}
          <!-- Unsigned: which side it sits on is the badge and the note, so the
               figure is a distance and never carries a minus of its own. -->
          <Value
            kind={reading === undefined ? 'both' : reading > 0 ? 'pos' : 'neg'}
            value={reading === undefined ? '—' : `${Math.abs(Math.round(reading * 100))}%`}
          />
        {/if}

        {#snippet graphic()}
          {#if screen === 'detail' && isSplit}
            <div class="bars"><PolarityBars negative={negAmount} positive={posAmount} /></div>
          {/if}
        {/snippet}

        {#snippet foot()}
          {#if screen === 'detail'}
            {detailFoot}

          {:else if screen === 'overview'}
            <Label text="Next gate" size="sm" />
            <span class="gate">
              <span class={['where', { none: !gate }]}>{gate ? gateLabel : 'nowhere else yet'}</span>
              {#if gate}
                <span class="status">{PlanetManager.canReach ? 'open' : 'gated'}</span>
              {/if}
            </span>

          {:else if reading !== undefined}
            <ExcessMeter value={reading} gate={excessGate} side={getExcessSideLabel(reading)} />
          {/if}
        {/snippet}
      </Cell>
    </NavSection>
  {/each}
</HeaderBand>

{#if progression.isRevealed('frame.rail')}
  <Rail>
    <UpgradeRail />
  </Rail>
{/if}

<style>
  /* Tighter than the badge's usual gap: the badge is holding two figures apart
     rather than labelling one, so it wants to sit between them. */
  .pair {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  .bars {
    max-width: 470px;
  }

  .gate {
    display: flex;
    align-items: baseline;
    gap: 7px;
    margin-top: var(--sp-1);
  }

  .where { font-size: var(--fs-sm); color: var(--ink-900); }
  .where.none { color: var(--ink-200); }
  .status {
    font-size: var(--fs-xs);
    color: var(--ink-900);
  }
</style>
