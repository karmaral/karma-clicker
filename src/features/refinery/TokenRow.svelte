<script lang="ts">
  /**
   * One grade. Handed a plain descriptor rather than a class, unlike `CohortRow`
   * — the four rows are not four of a kind, and the differences between them
   * (two polarised, one paired, one locked) are the table's to resolve.
   */
  import { Badge, PurchaseButton, Value } from '$ui';
  import type { BadgeKind } from '$ui';
  import { f, formatCost } from '$lib/utils';
  import { GRADE_LABELS, GRADE_SOURCES, type GradeKey } from '$lib/labels';
  import { badgeFor } from '$features/details/badge';

  interface Props {
    grade: GradeKey;
    held: number;
    /** The passive route, drawn beside the price and never a control. */
    passive?: { amount: number; kind: BadgeKind };
    cost?: number;
    costKind?: BadgeKind;
    quantity?: number;
    affordable?: boolean;
    note?: string;
    onpurchased?: () => void;
    /** Right-clicking the button advances the mode, without leaving the row. */
    oncyclemode?: () => void;
  }

  let {
    grade,
    held,
    passive,
    cost,
    costKind = 'red-both',
    quantity = 1,
    affordable = false,
    note,
    onpurchased,
    oncyclemode,
  }: Props = $props();

  const isLocked = $derived(cost === undefined);
</script>

<div class={['row', { locked: isLocked }]} role="group">
  <div class="ident">
    <span class="name">{GRADE_LABELS[grade]}</span>
    <span class="source">{GRADE_SOURCES[grade]}</span>
  </div>

  <span class="held">
    <Value kind={badgeFor(grade)} value={f(held)} size="md" />
  </span>

  <div class="cost" title={note}>
    {#if passive}
      <span class="passive">
        <span class="num">{formatCost(passive.amount)}</span>
        <Badge kind={passive.kind} />
      </span>
      <span class="or">or</span>
    {/if}

    {#if isLocked}
      <button type="button" class="locked-button" disabled>Locked</button>
    {:else}
      <PurchaseButton
        kind={costKind}
        amount={formatCost(cost!)}
        {quantity}
        {affordable}
        onclick={onpurchased}
        oncycle={oncyclemode}
      />
    {/if}
  </div>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: var(--token-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding-inline: 12px;
    padding-block: var(--sp-4);
    margin-inline: -12px;
    border-bottom: var(--rule-row);
    min-width: 0;
    user-select: none;
  }

  .row:hover:has(:global(.affordable)) {
    background-color: var(--surface-alt);
  }

  /* A rung not yet reached. The badge keeps its hue so the ladder still reads. */
  .row.locked {
    color: var(--ink-300);

    & .name { color: var(--ink-300); }
    & .held :global(.fig) { color: var(--ink-300); }
  }

  /* Baselined against `.held` (see below) rather than centred — the description
     hangs absolute beneath it, so nothing here needs flow room for it. */
  .ident {
    position: relative;
    align-self: baseline;
    min-width: 0;
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
    color: var(--ink-900);
  }

  /* Out of flow: the row's own height no longer has to fit it, only the taller
     `padding-block` above does. */
  .source {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding-top: var(--sp-1);
    font-size: var(--fs-sm);
    color: var(--ink-500);
    line-height: 1.3;
  }

  .held {
    display: flex;
    justify-content: flex-end;
    align-self: baseline;
  }

  .cost {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-2);
    min-width: 0;
    align-self: stretch;
    /* Reclaims the row's own block padding, short 4px — same inset CohortRow
       gives its purchase cell, so the two row families read as one system. */
    margin-block: calc((var(--sp-4) - 4px) * -1);
  }

  /* Information, not a control: what the refinery pays for the same thing. */
  .passive {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-300);
  }

  .or {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
  
  .cost :global(.purchase) {
    margin-left: unset;
  }

  .locked-button {
    padding: var(--sp-1) var(--sp-2);
    border: 1px solid var(--line-200);
    background: transparent;
    color: var(--ink-300);
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
</style>
