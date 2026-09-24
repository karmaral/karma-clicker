<script lang="ts">
  /**
   * What leaving buys, in the three currencies it is paid in: a batch, a clock,
   * and what you keep. Every figure moves under the split — the cycle directly,
   * the yields only in that the alignment routes them — so the panel is a
   * readout on the drag and not a summary of the world.
   *
   * Each yield's rate stands under the cycle, not beside its batch: the lump says
   * what one delivery is, the rate is that lump over the clock above it.
   */
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ArrowRight } from '@steeze-ui/tabler-icons';
  import { Figure, Label, Value } from '$ui';
  import { getFirstHarvestAlignment } from '$lib/excess';
  import { getBoonLabel } from '$lib/labels';
  import {
    resolveHarvestDuration, resolveHarvestYields, sumHarvestRates,
  } from '$lib/planets/harvest';
  import { badgeFor, byRateOrder } from '../details/badge';
  import RateFigure from '../details/RateFigure.svelte';
  import { f, formatSpan } from '$lib/utils';
  import balance from '$data/balance';
  import type Planet from '$lib/planets/base.svelte';
  import type { HarvestRates, ResourceType } from '$types';

  interface Props {
    planet: Planet;
    /** The share of the army the split would leave. The clock reads off it. */
    mergedShare: number;
    /** Income at departure. What one delivery is worth is a multiple of it. */
    rates: HarvestRates;
  }

  let { planet, mergedShare, rates }: Props = $props();

  const harvest = $derived(planet.data.harvest);

  const alignment = $derived(getFirstHarvestAlignment());

  const paid = $derived(
    // The anchors are read at departure by `Harness` and do not reach this
    // projection, so it is not a promise — it is what leaving right now would lock.
    resolveHarvestYields(harvest?.yields ?? {}, alignment, rates),
  );

  /**
   * The clock this world would keep once you have gone, at the split as it
   * stands. `~` because merged souls round per cohort and the figure moves under
   * the handle — an exact-looking span on a number still being dragged is a lie.
   */
  const cycle = $derived(
    harvest ? resolveHarvestDuration(harvest.duration, mergedShare, harvest) : 0,
  );

  /**
   * The batch spread over its own clock, which is the only figure that can be
   * held against the income you are leaving behind — a delivery is a lump and a
   * rate is not. Off `sumHarvestRates` rather than divided here, so a world that
   * pays once drops out of the map instead of dividing by zero.
   */
  const perSecond = $derived(
    new Map(sumHarvestRates([{ yields: paid, duration: cycle }]).map((r) => [r.type, r.perSecond])),
  );

  const yields = $derived(
    (Object.keys(paid) as ResourceType[])
      .sort(byRateOrder)
      .map((type) => ({ type, amount: paid[type] ?? 0, rate: perSecond.get(type) })),
  );

  /**
   * How the yields above are reached, stated with this world's numbers: seconds
   * of income at departure, then even's bonus on experience where it applies.
   * Mirrors `resolveHarvestYields`.
   */
  const formula = $derived.by(() => {
    // Declared in seconds; `formatSpan` reads ms.
    // Even pays no karma, so its term would describe a figure that is not there.
    const declared = Object.entries(harvest?.yields ?? {})
      .filter(([type]) => alignment !== 0 || type !== 'karma');
    const spans = new Set(declared.map(([, seconds]) => seconds));

    const base = spans.size === 1
      ? `${formatSpan(declared[0][1] * 1000)} of income at departure`
      : declared.map(([type, seconds]) => `${formatSpan(seconds * 1000)} of ${type} income`).join(' · ');

    const bonus = alignment === 0
      && `experience ×${f(1 + balance.harvest.evenExperienceBonus)} even`;

    return [base, bonus].filter(Boolean).join(' · ');
  });

  const boons = $derived(planet.data.boons ?? []);

  /**
   * The content's own height, fed back as the sizer's so the panel can ease
   * between them — `height: auto` cannot be transitioned. Unset until measured,
   * so the panel opens at its size instead of growing into it.
   */
  let height = $state(0);
</script>

<div class="output">
  <div class="sizer" style:height={height ? `${height}px` : undefined}>
    <div class="content" bind:offsetHeight={height}>
      <Label text="Projected output" />

      <!-- Name, figure, then anything that qualifies it. -->
      <div class="block">
        <Label text="Yields" size="caption" />
        <div class="yields">
          {#each yields as paid (paid.type)}
            <Value
              kind={badgeFor(paid.type)}
              value="+{f(paid.amount)}"
              size="lg"
            />
          {:else}
            <span class="none">nothing</span>
          {/each}
        </div>
        {#if formula}
          <span class="sum">{formula}</span>
        {/if}
      </div>

      <div class="block">
        <Label text="Harvest cycle" size="caption" />
        {#if cycle}
          <!-- The clock and its flow on one line: the rates are the batch over
               this span, so they belong to the figure rather than under it. -->
          <div class="rates">
            <Figure value="~{formatSpan(cycle)}" size="md" />
            <span class="arrow"><Icon src={ArrowRight} size="14px" /></span>
            {#each yields as paid (paid.type)}
              {#if paid.rate !== undefined}
                <RateFigure type={paid.type} value={paid.rate} />
              {/if}
            {/each}
          </div>
        {:else}
          <span class="none">pays once</span>
        {/if}
      </div>

      <!-- Only when there is one: a heading over nothing is a block spent on
           an absence. -->
      {#if boons.length}
        <div class="block">
          <Label text="First harvest boons" size="caption" />
          <div class="boons">
            {#each boons as boon, i (i)}
              <span class="boon">{getBoonLabel(boon)}</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* The prestige screen's panel, because this is the same kind of reading: what
     a one-way verb buys, in the register that screen already set. */
  .output {
    padding: var(--sp-4);
    background: var(--surface);
    border: var(--rule-card);
    min-width: 0;
  }

  /* Eases to whatever the content measures — a yield dropping out when the
     reading goes even, or the row wrapping as a figure grows a digit. Clipped
     so a shrink does not spill past the card while it runs. */
  .sizer {
    overflow: hidden;
    transition: height var(--t-slow);
  }

  /* Grouping by space alone, no rules: blocks sit several times further from
     each other than a header does from its own figures. */
  .content {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }

  /* The title heads the panel rather than standing as a block of its own. */
  .content > :global(.label) {
    margin-bottom: calc(var(--sp-3) - var(--sp-5));
  }

  /* The span leads to its rates — an arrow says *per this span*, where the
     yields' spacing alone read them as peers. Pulled in off the row's gap so
     span and flow read as one phrase, while the rates keep their air between
     each other. Out of the baseline group: an icon has no baseline of its own. */
  .arrow {
    display: flex;
    align-self: center;
    margin-inline: calc(var(--sp-2) - var(--sp-4));
    color: var(--ink-300);
  }

  /* Name, figure, footnote. Left, so the block reads down rather than across
     an empty middle. */
  .block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
    min-width: 0;
  }

  /* A caption's ink and weight at the small label's size: big enough to head a
     block, light enough not to rival the title above it. */
  .block > :global(.label.caption) {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
  }

  /* The cycle one size under the yields: they are what you get, the clock only
     qualifies them. */
  .yields, .rates {
    display: flex;
    align-items: last baseline;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
    min-width: 0;
  }

  .boons {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 0;
  }

  .boon {
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--ink-900);
  }

  .sum {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .none {
    font-size: var(--fs-base);
    color: var(--ink-300);
  }
</style>
