<script lang="ts">
  import type { Props as TippyProps } from 'tippy.js';
  import { PurchaseButton, SweepBar, Tooltip, tooltip } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import type { Listener } from '$lib/emission';
  import { aim } from '$lib/aim';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f, formatCost, roman } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { PurchaseMode } from './types';
  import LeanMeter from './LeanMeter.svelte';
  import CohortTooltip from './CohortTooltip.svelte';
  import { badgeFor } from './badge';
  import { resolvePurchasable, resolveQuantity } from './purchase';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    purchaseMode?: PurchaseMode;
    showAim?: boolean;
    compact?: boolean;
    /** The head prices the same buy this row is previewing. Undefined clears it. */
    onpreview?: (id: string | undefined) => void;
    onpurchase?: (quantity: number) => void;
    /** Right-clicking the button advances the mode, without leaving the row. */
    oncyclemode?: () => void;
  }

  let {
    cohort,
    purchaseMode = '1',
    showAim = true,
    compact = true,
    onpreview,
    onpurchase,
    oncyclemode,
  }: Props = $props();

  const resolvedQuantity = $derived(resolveQuantity(cohort, purchaseMode));
  const quantity = $derived(resolvePurchasable(cohort, purchaseMode));
  const cost = $derived(cohort.getCost(quantity) ?? 0);
  const affordable = $derived(resolvedQuantity > 0 && BuildingManager.canAfford(cohort.id, resolvedQuantity));
  const aimed = $derived(aim.resolve(cohort.data));

  /** Lit while an upgrade that would change this cohort is being hovered. */
  const isLit = $derived(spotlight.isLit('cohort', cohort.id));

  function startPreview() {
    onpreview?.(cohort.id);
  }

  function endPreview() {
    onpreview?.(undefined);
  }

  let tooltipElem: HTMLElement | undefined = $state();
  /** The bar sweeps on the cohort's own clock; this is all it needs to know. */
  function sweepOf(id: string) {
    return (fn: Listener) => {
      BuildingManager.addListener(id, 'queue', fn);

      return () => BuildingManager.removeListener(id, 'queue', fn);
    };
  }

  const tooltipOptions: Partial<TippyProps> = {
    // Anchored to the button's own edge, so the panel opens back over the table
    // it describes rather than off the right of the window.
    placement: 'top-end',
    delay: [300, 0],
    offset: [0, 16],
    interactive: false,
    // The reference is a buy button: a click must not dismiss the panel that
    // says what the click just did. Without this the row goes quiet mid-buy and
    // stays quiet until the pointer leaves the cell and comes back.
    hideOnClick: false,
  };
</script>

<div class={["row", { compact, lit: isLit }]}
  role="group"
>
  <div class="count num">{f(cohort.count)}</div>

  <div class="ident">

    <div class="header">
      <span class="name">
        {texts[cohort.id]?.title ?? cohort.id}
      </span>

      <!-- Tier is what has been bought; the second half is the run to the count
           that puts the next one on sale. Two different things, so neither one
           may be called `next` alone. Roman, to match the upgrade it names. -->
      {#if cohort.data.upgrade_threshold}
        <div class="level">
          <span class="tier">{cohort.tier ? `${roman(cohort.tier)}` : '-'}</span>
          ·
          <span>
            {#if cohort.isMaxLevel}
              max
            {:else}
              next unlock in {f(cohort.nextUntilThreshold)}
            {/if}
          </span>
        </div>
      {/if}

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
      needle={aim.needleFor(aimed)}
      unaimable={aimed.unaimable}
      lean={aim.leanFor(aimed)}
    />
  {/if}

  <!-- The button fills this cell, so hovering the cell is hovering the button —
       and the cell, not the name, is what the panel hangs off: you read the
       derivation where you decide to pay for it. -->
  <div class="purchase-container" role="group"
    {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}
  >
    <PurchaseButton
      kind={badgeFor(cohort.data.cost_type!)}
      amount={formatCost(cost)}
      {affordable}
      onclick={() => onpurchase?.(quantity)}
      onmouseenter={startPreview}
      onmouseleave={endPreview}
      oncycle={oncyclemode}
      {quantity}
    />

    <div class="tooltip-wrapper" bind:this={tooltipElem} style:--tooltip-max="380px">
      <Tooltip>
        <CohortTooltip {cohort} {purchaseMode} />
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
  /* Every row, not only an affordable one — the tint says which row is being
     read, and the button says whether you can act on it. */
  .row:hover {
    background-color: var(--surface-alt);
  }

  /* The same tint, lit from outside — hovering an upgrade in the rail or the
     catalogue says which row it would change. */
  .row.lit {
    background-color: var(--surface-alt);
  }

  /* The button fills the cell height, then reclaims the row's own padding on
     top of that — short 4px, so it reads as the row's one control without
     crowding the rule above it or the duration line below. */
  .purchase-container {
    align-self: stretch;
    margin-block: calc((var(--sp-3) - 4px) * -1) -22px;
  }
  .row.compact .purchase-container {
    margin-block: -7px -13px;
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
  .tier {
    display: grid;
    place-items: center;
    border: 1px solid var(--line-200);
    line-height: 1;
    font-weight: 500;
    font-size: 8px;
    height: 1.5em;
    width: 1.5em;
    text-align: center;
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
