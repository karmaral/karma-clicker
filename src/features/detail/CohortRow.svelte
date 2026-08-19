<script lang="ts">
  import type { Props as TippyProps } from 'tippy.js';
  import { Badge, PurchaseButton, Meter, SweepBar, Tooltip, tooltip } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import type { Listener } from '$lib/emission';
  import { aim } from '$lib/aim';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { YieldType } from '$types';
  import type { PurchaseMode } from './types';
  import LeanMeter from './LeanMeter.svelte';
  import { badgeFor } from './badge';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    purchaseMode?: PurchaseMode;
    showAim?: boolean;
    compact?: boolean;
    onpurchase?: (quantity: number) => void;
  }

  let {
    cohort,
    purchaseMode = '1',
    showAim = true,
    compact = true,
    onpurchase,
  }: Props = $props();

  const resolvedQuantity = $derived.by(() => {
    if (purchaseMode === 'Max') return BuildingManager.getAffordableQuantity(cohort.id) ?? 0;
    if (purchaseMode === 'Next') return cohort.nextUntilThreshold;

    return Number(purchaseMode);
  });

  const quantity = $derived(Math.max(1, resolvedQuantity));
  const cost = $derived(cohort.getCost(quantity) ?? 0);
  const affordable = $derived(resolvedQuantity > 0 && BuildingManager.canAfford(cohort.id, resolvedQuantity));
  const aimed = $derived(aim.resolve(cohort.id, cohort.data));

  const TREND_DEADBAND = 0.005;

  const TREND_MARKS: Record<number, string> = { [-1]: '▼', 0: '', 1: '▲' };

  const TREND_TITLES: Record<number, string> = {
    [-1]: 'Your aim is holding this rate down',
    0: '',
    1: 'Your aim is lifting this rate',
  };

  /** Against Even — what your aim is doing to this rate, not what the wave is. */
  function trendOf(value: number, atEven: number) {
    const delta = value - atEven;
    if (Math.abs(delta) <= atEven * TREND_DEADBAND) return 0;

    return Math.sign(delta);
  }

  /** One line per figure. Karma reads as two once beat 6 has split the pile. */
  const rates = $derived.by(() => {
    return Object.keys(cohort.production).flatMap((key) => {
      const type = key as YieldType;
      if (type !== 'karma') return [{ type, value: cohort.perSecond(type), trend: 0 }];

      const now = cohort.karmaPerSecond();
      if (!progression.runs('negKarma')) return [{ type, value: now.positive, trend: 0 }];

      const even = cohort.karmaPerSecond(0);

      return [
        {
          type: 'karma_negative' as YieldType,
          value: now.negative,
          trend: trendOf(now.negative, even.negative),
        },
        {
          type: 'karma_positive' as YieldType,
          value: now.positive,
          trend: trendOf(now.positive, even.positive),
        }
      ];
    });
  });

  let isHovered: boolean = $state(false);

  let tooltipElem: HTMLElement | undefined = $state();
  /** The bar sweeps on the cohort's own clock; this is all it needs to know. */
  function sweepOf(id: string) {
    return (fn: Listener) => {
      BuildingManager.addListener(id, 'queue', fn);

      return () => BuildingManager.removeListener(id, 'queue', fn);
    };
  }

  const tooltipOptions: Partial<TippyProps> = {
    placement: 'right',
    delay: [650, 0],
    offset: [0, 16],
    interactive: false,
  };
</script>

<div class={["row", { compact }]}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  role="group"
>
  <div class="count num">{f(cohort.count)}</div>

  <div class="ident">

    <div class="header" >
      <span class="name">
        {texts[cohort.id]?.title ?? cohort.id}
      </span>

      {#if cohort.data.upgrade_threshold}
        <div class="level">
          <span>level {cohort.level}</span>
          ·
          <span>
            {#if cohort.isMaxLevel}
              max
            {:else}
              next in {f(cohort.nextUntilThreshold)}
            {/if}
          </span>
        </div>
      {/if}

      <span class="tooltip-hint">···</span>
    </div>

    <span class="description">{texts[cohort.id]?.description ?? ''}</span>

    <span class="duration">
      <SweepBar subscribe={sweepOf(cohort.id)} />
      {f(cohort.duration / 1000)}s
    </span>

  </div>

  {#if showAim}
    <LeanMeter
      negativeReach={aimed.negativeReach}
      positiveReach={aimed.positiveReach}
      lean={aim.leanFor(aimed)}
    />
  {/if}

  <span class="output">
    {#each rates as rate (rate.type)}
      <span 
        class={['output-type', rate.type ]} 
        title={TREND_TITLES[rate.trend]}
      >
        <Badge kind={badgeFor(rate.type)} />
        <span class="value num">
          +{f(rate.value)}<span class="unit">/s</span>
          <span class={['trend', { 'down': rate.trend < 0 }]}>
            {TREND_MARKS[rate.trend]}
          </span>
        </span>
      </span>
    {/each}
  </span>


  <div class="purchase-container"
    {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}
  >
    <PurchaseButton
      kind={badgeFor(cohort.data.cost_type!)}
      amount={f(cost)}
      {affordable}
      onclick={() => onpurchase?.(quantity)}
      {quantity}
    />

    <div class="tooltip-wrapper" bind:this={tooltipElem}>
      <Tooltip
        title={texts[cohort.id]?.title}
        description={texts[cohort.id]?.description}
      >
        name, lore, rates, +each and all that
      </Tooltip>
    </div>
  </div>


</div>

<style>
  .row {
    position: relative;
    display: grid;
    grid-template-columns: var(--cohort-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding-inline: 12px;
    padding-block: var(--sp-3) 26px;
    margin-inline: -12px;
    border-bottom: var(--rule-row);
    min-width: 0;
    user-select: none;

  }
  .row:hover:has(:global(.affordable)) {
      background-color: var(--surface-alt);
  }

  .ident {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 0;
    position: relative;
  }
  .header {
    align-self: start;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
    z-index: 1;
    position: relative;
    align-self: start;
    display: flex;
    gap: var(--sp-2);

  }
  .tooltip-hint {
    visibility: hidden;
    color: var(--ink-300);
    font-weight: 500;
    line-height: 1;
    translate: 0% -1px;
    align-self: center;
  }
  .row:hover .tooltip-hint { visibility: visible; }
  
  .tooltip-wrapper { pointer-events: none; }
  .row :global(.tippy-box) { pointer-events: none !important; }

  .description {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    line-height: 1.3;
  }

  .level {
    display: flex;
    align-items: center;
    font-size: 10.5px;
    color: var(--ink-300);
    gap: var(--sp-1);
    text-wrap: nowrap;
  }

  .count {
    font-size: var(--fs-md);
    font-weight: 600;
    text-align: right;
  }

  .duration {
    position: absolute;
    bottom: -16px;
    left: 0;
    display: flex;
    align-items: center;
    color: var(--ink-500);
    gap: var(--sp-2);
    font-weight: 500;
  }

  /* Karma is two figures here, so the 170px column is tight — watch it wrap. */
  .output {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: end;
    gap: var(--sp-2);
    min-width: 0;
    position: relative;
  }
  .output-type {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  .value {
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-900);
    position: relative;
  }
  .unit {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--ink-300);
    margin-left: 1px;
  }
  .trend {
    width: 7px;
    font-size: 7px;
    line-height: 1;
    color: var(--ink-400);
    text-align: right;
    left: 0;
    top: -8px;
    position: absolute;
  }
  .trend.down {
    top: 12px;
  }

  .row.compact {
    padding-block: 11px 17px;

    & .description { display: none; }

    & .count { font-size: var(--fs-base); }

    & .duration { font-size: 10.5px; }

  }

  .row :global(.purchase::after) {
    content: unset;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    left: 0;
    right: 0;
  }

</style>
