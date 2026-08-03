<script lang="ts">
  import Badge from './Badge.svelte';
  import type { BadgeKind } from './types';

  interface Props {
    kind: BadgeKind;
    amount: string;
    affordable?: boolean;
    disabled?: boolean;
    onclick?: () => void;
  }

  let {
    kind,
    amount,
    affordable = false,
    disabled = false,
    onclick,
  }: Props = $props();
</script>

<button
  type="button"
  class={['buy', { affordable }]}
  {disabled}
  {onclick}
>
  <Badge {kind} />
  <span class="amount num">{amount}</span>
</button>

<style>
  .buy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--badge-gap);
    width: 100%;
    min-width: 0;
    padding: 6px var(--sp-2);
    background: var(--surface);
    border: 1px solid var(--line-300);
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--t-fast), border-color var(--t-fast);
    height: 100%;
  }

  .amount {
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-500);
  }

  .buy.affordable {
    border-color: var(--ink-900);
  }

  .buy.affordable .amount {
    color: var(--ink-900);
  }

  .buy.affordable:hover:not(:disabled) {
    background: var(--surface-alt);
  }

  .buy:disabled {
    cursor: default;
  }
</style>
