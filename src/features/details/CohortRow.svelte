<script lang="ts">
  import type { Props as TippyProps } from 'tippy.js';
  import { PurchaseButton, SweepBar, Tooltip, tooltip } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import type { Listener } from '$lib/emission';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f, formatCost, roman } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { PurchaseMode } from './types';
  import CohortTooltip from './CohortTooltip.svelte';
  import { badgeFor } from './badge';
  import { resolvePurchasable, resolveQuantity } from './purchase';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    purchaseMode?: PurchaseMode;
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
    compact = true,
    onpreview,
    onpurchase,
    oncyclemode,
  }: Props = $props();

  const resolvedQuantity = $derived(resolveQuantity(cohort, purchaseMode));
  const quantity = $derived(resolvePurchasable(cohort, purchaseMode));
  const cost = $derived(cohort.getCost(quantity) ?? 0);
  const affordable = $derived(resolvedQuantity > 0 && BuildingManager.canAfford(cohort.id, resolvedQuantity));

  /**
   * A cohort starts manual — see `docs/design.md` §5, *Clerks*. The send verb
   * is what a row has instead of a clock until its clerk is bought, and the
   * whole row is the send target — only the purchase cell opts back out.
   */
  const canSend = $derived(!cohort.isAutonomous && cohort.count > 0);

  function send() {
    if (cohort.isInProgress) return;

    cohort.queueAction();
  }

  /** The purchase cell is its own control — a click there must not also send. */
  function onRowClick(e: MouseEvent) {
    if (!canSend) return;
    if ((e.target as HTMLElement).closest('.purchase-container')) return;

    send();
  }

  function onRowKeydown(e: KeyboardEvent) {
    if (!canSend || (e.key !== 'Enter' && e.key !== ' ')) return;

    e.preventDefault();
    send();
  }

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
    // Anchored to the trigger's leading edge — its trailing edge the panel
    // could run past the window on a wide table.
    placement: 'top-start',
    delay: [300, 0],
    offset: [0, 16],
    interactive: false,
    // The reference is a buy button: a click must not dismiss the panel that
    // says what the click just did. Without this the row goes quiet mid-buy and
    // stays quiet until the pointer leaves the cell and comes back.
    hideOnClick: false,
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -- role turns interactive with canSend; the linter can't see the ternary. -->
<div class={["row", { compact, lit: isLit, sendable: canSend, sending: canSend && cohort.isInProgress }]}
  role={canSend ? 'button' : 'group'}
  tabindex={canSend ? 0 : undefined}
  onclick={onRowClick}
  onkeydown={onRowKeydown}
>
  <div class="ident" {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}>

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

    <!-- A life too short to time is not a fast time, it is a rate — so the
         figure gives way to the word rather than counting down to two decimals
         nobody can read. -->
    <span class="duration">
      <SweepBar subscribe={sweepOf(cohort.id)} streaming={cohort.isStreaming} />
      {#if cohort.isStreaming}
        <span class="stream">stream</span>
      {:else}
        {f(cohort.duration / 1000)}s
      {/if}
      {#if canSend}
        <span class="send" class:sending={cohort.isInProgress}>Send</span>
      {/if}
    </span>

  </div>

  <div class="count num">{f(cohort.count)}</div>

  <!-- The button fills this cell, so hovering the cell is hovering the button.
       Its click opts out of the row's own send — you read the derivation where
       you decide to pay for it, and buying is never also sending. -->
  <div class="purchase-container" role="group" {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}>
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

  /* The whole row is the send target while there is no clerk — only the
     purchase cell opts back out. */
  .row.sendable {
    cursor: pointer;
  }

  /* The same tint, lit from outside — hovering an upgrade in the rail or the
     catalogue says which row it would change. */
  .row.lit {
    background-color: var(--surface-alt);
  }

  /* A trip is out. A band crosses the whole row, because this is the one state
     you have to read without looking for it — a mark on the verb alone is lost
     in a table of rows. The same reading as the stream bar, at row scale: not a
     thing moving across, a shading passing over.

     A wash of the page's own ink at low alpha rather than a light tone, so it
     composites over whatever the row is already wearing — the hover tint, the
     spotlight tint — instead of replacing it. Constant colour, alpha alone
     ramping, so the falloff never dips muddy on its way out.

     Half the row wide, travelling from off one edge to off the other. **The two
     middle stops are the only knob**: together they are the flat top of the
     band, so widen the gap to fatten it and close it to soften the edges. Held
     nearly shut here — the band is almost pure falloff, which is what keeps a
     whole row of movement from reading as an alarm.

     Painted as the row's own background-image, so it sits behind the text with
     no stacking games and the hover colour still shows through it. */
  .row.sending {
    background-image: linear-gradient(
      90deg,
      rgba(17, 17, 17, 0) 0%,
      rgba(17, 17, 17, .04) 46%,
      rgba(17, 17, 17, .04) 54%,
      rgba(17, 17, 17, 0) 100%
    );
    background-size: 50% 100%;
    background-repeat: no-repeat;
    animation: row-flow 2.4s linear infinite;
  }

  @keyframes row-flow {
    from { background-position: -100% 0; }
    to { background-position: 200% 0; }
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
    /* Shrink-to-fit, not the full 1fr track — the tooltip trigger should hug
       what's actually there. The track itself keeps its width regardless, so
       count/purchase stay aligned across rows. */
    justify-self: start;
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

  /* The word standing where the figure was — same weight, so a row that starts
     streaming does not also get louder. */
  .stream {
    letter-spacing: .08em;
    text-transform: uppercase;
    font-size: .9em;
  }

  /* No clock until the clerk is bought — this is the row's clock in the
     meantime. A hint, not its own control: the row itself is what sends. */
  .send {
    font-weight: 600;
    color: var(--ink-700);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .row.sendable:hover .send {
    color: var(--ink-900);
  }

  /* The verb goes quiet while the trip is out — the row's breathing is what
     says it is working, so the word only has to stop offering. */
  .send.sending {
    color: var(--ink-300);
    text-decoration: none;
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
