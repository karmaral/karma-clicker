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
  }: Props = $props();
</script>

<button
  type="button"
  class={['purchase', { affordable }]}
  {disabled}
  {onclick}
  {onmouseenter}
  {onmouseleave}
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
    padding: var(--sp-1) var(--sp-2);
    /* margin-block: calc(var(--sp-1) * -1); */
    margin-left: auto;
    margin-right: calc(var(--sp-2) * -1);
    border: 1px solid;
    background: transparent;
    border-color: currentColor;
    color: var(--ink-300);
    cursor: pointer;
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

  .purchase:disabled {
    cursor: default;
  }
</style>
