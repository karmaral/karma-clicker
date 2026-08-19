<script lang="ts">
  import { Badge, Cell, Figure, HeaderBand, Rail, Value } from '$ui';
  import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
  import { getExcess } from '$lib/excess';
  import { progression } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { SCREENS, getExcessSideLabel, type ScreenName } from '$lib/labels';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import type { ResourceType } from '$types';
  import NavSection from './NavSection.svelte';
  import UpgradeRail from './UpgradeRail.svelte';

  const WIDTHS: Record<ScreenName, string> = {
    overview: '2fr',
    detail: '5.5fr',
    refinery: '3.5fr',
  };

  const visible = $derived(SCREENS.filter((screen) => nav.state(screen) !== 'absent'));
  const columns = $derived(visible.map((screen) => WIDTHS[screen]).join(' '));

  const experience = $derived(f(ResourceManager.getAmount('experience')));
  const posKarma = $derived(f(ResourceManager.getAmount('karma_positive')));
  const negKarma = $derived(f(ResourceManager.getAmount('karma_negative')));

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

  /** Signed, so the sign carries Burden versus Comfort. The meter is still ahead. */
  const excess = $derived(
    reading === undefined ? '—' : `${reading > 0 ? '+' : ''}${Math.round(reading * 100)}%`,
  );

  /**
   * Until tokens arrive the third section is named for the reading it carries, not
   * for the tab it becomes at beat 11 (CONTEXT v3 §3.2).
   */
  const isRefineryTab = $derived(progression.isRevealed('reading.tokens'));

  function getSectionLabel(screen: ScreenName) {
    if (screen === 'refinery' && !isRefineryTab) return 'Excess';

    return nav.label(screen);
  }

  function getSectionNote(screen: ScreenName) {
    if (screen === 'refinery' && !isRefineryTab) return getExcessSideLabel(reading);

    return undefined;
  }
</script>

<HeaderBand rule={false} {columns}>
  {#each visible as screen (screen)}
    <NavSection
      state={nav.state(screen)}
      active={nav.active === screen}
      onselect={() => nav.to(screen)}
    >
      <Cell
        label={getSectionLabel(screen)}
        labelNote={getSectionNote(screen)}
        caption={screen === 'refinery' && isRefineryTab ? 'learning tokens' : undefined}
        banded
      >
        {#if screen === 'overview'}
          {#if progression.isRevealed('reading.experience')}
            <Value kind="xp" value={experience} rate={showRates ? experienceRate : undefined} />
          {/if}

        {:else if screen === 'detail'}
          {#if progression.isRevealed('reading.negKarma')}
            <Value kind="neg" value={negKarma} rate={showRates ? negKarmaRate : undefined} />
          {/if}
          {#if progression.isRevealed('reading.posKarma')}
            <Value kind="pos" value={posKarma} rate={showRates ? posKarmaRate : undefined} />
          {/if}

        {:else if progression.isRevealed('reading.excess') || progression.isRevealed('reading.tokens')}
          {#if isRefineryTab}
            <!-- One badge between two figures: red is the only token still
                 holding a side, and the pair is the reading. Negative left, the
                 order the detail section and the grade table both take. Empty
                 rungs are drawn greyed rather than withheld, so the ladder shows
                 its height from the beat that reveals it. -->
            <span class="pair">
              <Figure value={f(negRed)} size="lg" muted={!negRed} />
              <Badge kind="red-both" />
              <Figure value={f(posRed)} size="lg" muted={!posRed} />
            </span>
            <Value kind="yellow" value={f(yellow)} size="lg" muted={!yellow} />
            <Value kind="blue" value={f(blue)} size="lg" muted={!blue} />
          {/if}
          {#if progression.isRevealed('reading.excess')}
            <!-- Dropped a size once the tokens share the column: four readings
                 in 3.5fr. Provisional — the mock gives excess its own labelled
                 row under a meter, and that is where this goes. -->
            <Value kind="both" value={excess} size={isRefineryTab ? 'lg' : 'xl'} />
          {/if}

        {:else}
          <span class="pending">—</span>
        {/if}
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
  .pending {
    font-size: var(--fs-xl);
    color: var(--ink-300);
  }

  /* Tighter than the badge's usual gap: the badge is holding two figures apart
     rather than labelling one, so it wants to sit between them. */
  .pair {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }
</style>
