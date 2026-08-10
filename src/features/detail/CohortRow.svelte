<script lang="ts">
  import { Badge, PurchaseButton, Meter, Tooltip, tooltip } from '$ui';
  import { aim } from '$lib/aim';
  import { formatNumber } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { YieldType } from '$types';
  import LeanMeter from './LeanMeter.svelte';
  import CycleBar from './CycleBar.svelte';
  import { badgeFor } from './badge';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    affordable?: boolean;
    showAim?: boolean;
    compact?: boolean;
    onbuy?: () => void;
  }

  let {
    cohort,
    affordable,
    showAim = true,
    compact = true,
    onbuy,
  }: Props = $props();

  const cost = $derived(cohort.getCost(1) ?? 0);
  const aimed = $derived(aim.resolve(cohort.id, cohort.data));

  let isHovered: boolean = $state(false);

  let tooltipElem: HTMLElement | undefined = $state();
  const tooltipOptions = {
    placement: 'bottom-start',
    delay: [350, 0],
    offset: [-12, 12],
    interactive: false,
  };
</script>

<div class={["row", { compact }]}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  role="group"
>
  <div class="count num">{formatNumber(cohort.count)}</div>

  <div class="ident">

    <div class="header"
      {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}
    >
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
              next at {formatNumber(cohort.nextUntilThreshold)}
            {/if}
          </span>
        </div>
      {/if}

      <span class="tooltip-hint">···</span>
      <div class="tooltip-wrapper" bind:this={tooltipElem}>
        <Tooltip
          title={texts[cohort.id]?.title}
          description={texts[cohort.id]?.description}
        />
      </div>
    </div>

    <span class="description">{texts[cohort.id]?.description ?? ''}</span>

    <span class="duration">
      <CycleBar id={cohort.id} />
      {formatNumber(cohort.duration / 1000)}s
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
    {#each Object.keys(cohort.production) as type}
    <span class="output-type">
      <Badge kind={badgeFor(type as YieldType)} />
      <span class="value num">
        +{formatNumber(cohort.perSecond(type as YieldType))}<span class="unit">/s</span>
      </span>
    </span>
    {/each}
  </span>


  <PurchaseButton
    kind={badgeFor(cohort.data.cost_type!)}
    amount={formatNumber(cost)}
    {affordable}
    onclick={onbuy}
  />


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

  .output {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-3);
    min-width: 0;
    position: relative;
    padding-right: var(--sp-2);
  }
  .output-type {
    gap: var(--badge-gap);
  }
  .value {
    font-size: var(--fs-base);
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
