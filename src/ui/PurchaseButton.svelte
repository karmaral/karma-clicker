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
  .purchase {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: var(--badge-gap);
    min-width: 0;
    height: 100%;
    padding: var(--sp-1) var(--sp-2);
    margin-left: auto;
    margin-right: calc(var(--sp-2) * -1);
    border: 1px solid;
    background: transparent;
    /* Quiet frame until there's something to press — a full-height box in
       --ink-300 would compete with the row's own rule; only an affordable
       button earns the loud border. */
    border-color: var(--line-300);
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
    border-color: currentColor;
    color: var(--ink-900);

    &:hover {
      color: white;
      background-color: var(--ink-900);
    }
  }
</style>
