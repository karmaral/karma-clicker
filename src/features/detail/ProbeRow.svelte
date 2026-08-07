<script lang="ts">
  import { Badge, BuyButton, Meter } from '$ui';
  import AimControl from './AimControl.svelte';
  import type { Probe } from './types';

  interface Props {
    probe: Probe;
    showAim?: boolean;
    onaim?: (value: number) => void;
    onbuy?: () => void;
  }

  let { probe, showAim = true, onaim, onbuy }: Props = $props();
</script>

<div class="row">
  <div class="ident">
    <span class="name">{probe.name}</span>
    <span class="description">{probe.description}</span>
    {#if probe.milestone !== undefined}
      <div class="milestone">
        <Meter value={probe.milestone} height="2px" />
      </div>
    {/if}
  </div>

  {#if showAim}
    <AimControl
      value={probe.aim}
      lean={probe.lean}
      note={probe.aimNote}
      unaimable={probe.unaimable}
      {onaim}
    />
  {/if}


  <span class="output">
    <Badge kind={probe.output.kind} />
    <span class="rate num">
      {probe.output.amount}{#if probe.output.unit}<span class="unit">{probe.output.unit}</span>{/if}
    </span>
  </span>
  <BuyButton
    kind={probe.cost.kind}
    amount={probe.cost.amount}
    affordable={probe.cost.affordable}
    onclick={onbuy}
  />

  <span class="count num">{probe.count}</span>

</div>

<style>
  .row {
    display: grid;
    grid-template-columns: var(--probe-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding: var(--sp-3) 0;
    border-bottom: var(--rule-row);
    min-width: 0;

    &:hover {
      background-color: var(--surface-alt);
    }
  }

  .count {
    font-size: var(--fs-md);
    font-weight: 600;
    text-align: right;
  }

  .ident {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 0;
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
  }

  .description {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    line-height: 1.3;
  }

  .milestone {
    max-width: calc(100% - var(--sp-6));
    margin-top: var(--sp-1);
  }

  .output {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--badge-gap);
    min-width: 0;
  }

  .rate {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-900);
  }

  .unit {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

</style>
