<script lang="ts">
  import { Badge, PurchaseButton, Meter, Tooltip, tooltip } from '$ui';
  import { formatNumber } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { ResourceType } from '$types';
  import AimControl from './AimControl.svelte';
  import CycleBar from './CycleBar.svelte';
  import { badgeFor } from './badge';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    affordable?: boolean;
    showAim?: boolean;
    aim?: number;
    lean?: string;
    aimNote?: string;
    unaimable?: boolean;
    compact?: boolean;
    onaim?: (value: number) => void;
    onbuy?: () => void;
  }

  let {
    cohort,
    affordable,
    showAim = true,
    aim = 0,
    lean = '',
    aimNote,
    unaimable,
    compact = true,
    onaim,
    onbuy,
  }: Props = $props();

  const cost = $derived(cohort.getCost(1) ?? 0);

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

  <div class="ident">
    <span class="name" 
      {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}
    >
      {texts[cohort.id]?.title ?? cohort.id}
      <span class="tooltip-hint">···</span>
    </span>
    <div class="tooltip-wrapper" bind:this={tooltipElem}>
      <Tooltip
        title={texts[cohort.id]?.title}
        description={texts[cohort.id]?.description}
      />
    </div>
    <span class="description">{texts[cohort.id]?.description ?? ''}</span>
    {#if cohort.data.upgrade_threshold}
      <div class="level">
        <span>level {cohort.level}</span>
        <Meter value={cohort.levelProgress} height="2px" />
        <span>
          {#if cohort.isMaxLevel}
            max
          {:else}
            next at {formatNumber(cohort.nextUntilThreshold)}
          {/if}
        </span>
      </div>
    {/if}
  </div>

  <div class="count num">{formatNumber(cohort.count)}</div>

  <div class="duration">
    {formatNumber(cohort.duration / 1000)}s
    <CycleBar id={cohort.id} />
  </div>

  <!-- {#if showAim}
    <AimControl
      value={aim}
      {lean}
      note={aimNote}
      {unaimable}
      {onaim}
    />
  {/if} -->


  <span class="output">
    {#each Object.entries(cohort.production) as [type, amount]}
      <Badge kind={badgeFor(type as ResourceType)} />
      <span class="value num">
        +{formatNumber(amount * cohort.count)}

        <span class="each num">
          +{formatNumber(amount)}
        </span>
      </span>
    {/each}
    <span class="each-label">each</span>
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

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
    z-index: 1;
    position: relative;
    align-self: start;
    display: flex;
    gap: var(--sp-2);

    & .tooltip-hint {
      display: none;
      color: var(--ink-300);
    }
  }
  .row:hover .tooltip-hint { display: inline; }
  
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
    gap: var(--sp-3);
    font-size: 10.5px;
    color: var(--ink-300);
    text-wrap: nowrap;
    width: 100%;
    position: absolute;
    left: 0;
    bottom: calc(var(--sp-1) * -1);
  }

  .count {
    font-size: var(--fs-md);
    font-weight: 600;
  }

  .duration {
    color: var(--ink-500);
    position: relative;
  }
  .duration :global(.cycle) {
    position: absolute;
    left: 0;
    bottom: calc(var(--sp-2) * -1);
  }

  .output {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--badge-gap);
    min-width: 0;
    padding-right: var(--sp-5);
    position: relative;

    & .value { margin-left: -3px; }
  }
  .value {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-900);
    position: relative;
  }

  .each {
    display: none;
    position: absolute;
    left: 0;
    bottom: calc(var(--sp-3) * -1);
    width: 100%;
    font-size: 10.5px;
    line-height: 12px;
    text-align: end;
    color: var(--status-gain);
  }
  .each-label {
    display: none;
    position: absolute;
    right: 0;
    bottom: calc(var(--sp-3) * -1);
    font-size: 10.5px;
    font-weight: 600;
    color: var(--ink-300);
    line-height: 12px;
  }
  .row:hover .each { display: block; }
  .row:hover .each-label { display: block; }
  
  .row.compact {
    padding-block: 11px 17px;

    & .description { display: none; }

    & .level { 
      bottom: -2px;
      translate: 0% 100%;
    }

    & .count { font-size: 14px; }

    & .duration { font-size: 13px; }

  }

  .row :global(.purchase::after) {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    left: 0;
    right: 0;
  }

</style>
