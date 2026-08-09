<script lang="ts">
    import type { Snippet } from 'svelte';
  import { tooltip } from './actions/tooltip';
  import Tooltip from './Tooltip.svelte';
  import type { ChipStatus } from './types';

  interface Props {
    label: string;
    cost?: string;
    status?: ChipStatus;
    disabled?: boolean;
    onclick?: () => void;
    tooltipContent?: Snippet;
  }

  let {
    label,
    cost,
    status = 'affordable',
    disabled = false,
    onclick,
    tooltipContent,
  }: Props = $props();

  let tooltipElem: HTMLElement | undefined = $state();
  const tooltipOptions: Partial<Props> = {
    placement: 'bottom-start',
    delay: [450, 0],
    interactive: false,
  };

</script>

<li>
  <button
    type="button"
    class={['chip', status]}
    {disabled}
    {onclick}
    {@attach tooltip({content: tooltipElem, options: tooltipOptions })}
  >
    <span class="name">{label}</span>
    {#if cost}
      <span class="cost num">{cost}</span>
    {/if}
  </button>

  {#if tooltipContent}
    <Tooltip bind:contentElem={tooltipElem}>
      <div class="tooltip-content">
        {@render tooltipContent()}
      </div>
    </Tooltip>
  {/if}

</li>

<style>
  li {
    list-style: none;
    padding: unset;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex: none;
    padding: 7px var(--sp-3);
    background: var(--surface);
    border: 1px solid var(--line-300);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--t-fast), color var(--t-fast);
  }

  .chip:disabled {
    cursor: default;
  }

  .name {
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  .cost {
    font-size: var(--fs-xs);
    font-weight: 400;
    opacity: .7;
  }

  .chip.affordable {
    border-color: var(--ink-900);
    color: var(--ink-900);
  }

  .chip.unlocked {
    color: var(--ink-500);
  }

  .chip.unlocked:hover:not(:disabled) {
    border-color: var(--ink-500);
  }

  .chip.approaching {
    border-style: dashed;
    border-color: var(--line-200);
    color: var(--ink-200);
  }

  .chip.approaching:hover:not(:disabled) {
    color: var(--ink-300);
    border-color: var(--line-300);
  }
</style>
