<script lang="ts">
  import Badge from './Badge.svelte';
  import type { BadgeKind } from './types';

  interface Props {
    kind: BadgeKind;
    quantity: number;
    amount: string;
    affordable?: boolean;
    disabled?: boolean;
    onclick?: () => void;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
    /** Right-click. Given one, the browser menu is suppressed on this button. */
    oncycle?: () => void;
  }

  let {
    kind,
    quantity,
    amount,
    affordable = false,
    disabled = false,
    onclick,
    onmouseenter,
    onmouseleave,
    oncycle,
  }: Props = $props();

  function contextmenu(event: MouseEvent) {
    if (!oncycle) return;

    event.preventDefault();
    oncycle();
  }
</script>

<button
  type="button"
  class={['purchase', { affordable }]}
  {disabled}
  {onclick}
  {onmouseenter}
  {onmouseleave}
  oncontextmenu={contextmenu}
>
  {#if quantity}
    <span class="quantity">{quantity}×</span>
  {/if}
  <span class="amount num">{amount}</span>
  <Badge {kind} />
</button>

<style>
  /**
   * The button fills the cell it is given, out to that cell's far edge — every
   * table that sells anything hands it one, and the cell's own hairline is the
   * whole separation. No frame of its own: a box in --ink-300 competed with the
   * row rules it sat between, and the figure alone says the price well enough.
   * The trailing 12px is the row's gutter, so the figure lands on the content
   * edge rather than on the card's.
   */
  .purchase {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: var(--badge-gap);
    width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    padding: var(--sp-1) 12px var(--sp-1) var(--sp-2);
    border: none;
    background: transparent;
    color: var(--ink-300);
    white-space: nowrap;
  }

  .quantity {
    font-size: var(--fs-xs);
    font-weight: 500;
  }

  .amount {
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1;
  }

  .purchase.affordable {
    color: var(--ink-900);

    &:hover {
      color: white;
      background-color: var(--ink-900);
    }
  }
</style>
