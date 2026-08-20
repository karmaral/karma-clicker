<script lang="ts">
  /**
   * One grade. Handed a plain descriptor rather than a class, unlike `CohortRow`
   * — the four rows are not four of a kind, and the differences between them
   * (two polarised, one paired, one locked) are the table's to resolve.
   */
  import { Badge, PurchaseButton } from '$ui';
  import type { BadgeKind } from '$ui';
  import { f, formatCost } from '$lib/utils';
  import { GRADE_LABELS, GRADE_SOURCES, type GradeKey } from '$lib/labels';
  import { badgeFor } from '$features/detail/badge';

  interface Props {
    grade: GradeKey;
    held: number;
    /** What the refinery adds each batch. Only red has one; the rest draw a dash. */
    perBatch?: number;
    /** The passive route, drawn beside the price and never a control. */
    passive?: { amount: number; kind: BadgeKind };
    cost?: number;
    costKind?: BadgeKind;
    affordable?: boolean;
    /** Why the price is what it is. Native title — the figure moves, the reason does not. */
    note?: string;
    onbuy?: () => void;
  }

  let {
    grade,
    held,
    perBatch,
    passive,
    cost,
    costKind = 'red-both',
    affordable = false,
    note,
    onbuy,
  }: Props = $props();

  const isLocked = $derived(cost === undefined);
</script>

<div class={['row', { locked: isLocked }]} role="group">
  <div class="ident">
    <span class="name">
      <Badge kind={badgeFor(grade)} />
      {GRADE_LABELS[grade]}
    </span>
    <span class="source">{GRADE_SOURCES[grade]}</span>
  </div>

  <span class="num held">{f(held)}</span>

  <span class="num batch">
    {#if perBatch === undefined}
      —
    {:else}
      +{f(perBatch)}
    {/if}
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
      <PurchaseButton kind={costKind} amount={formatCost(cost!)} {affordable} onclick={onbuy} />
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
    padding-block: var(--sp-3);
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

    & .name,
    & .held { color: var(--ink-300); }
  }

  .ident {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 0;
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
    color: var(--ink-900);
  }

  .source {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    line-height: 1.3;
  }

  .held {
    font-size: var(--fs-md);
    font-weight: 600;
    text-align: right;
    color: var(--ink-900);
  }

  .batch {
    font-size: var(--fs-sm);
    font-weight: 600;
    text-align: right;
    color: var(--ink-500);
  }

  .cost {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-2);
    min-width: 0;
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
    cursor: default;
  }
</style>
