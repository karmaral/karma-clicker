<script lang="ts">
    import type { Snippet } from 'svelte';
  import { tooltip } from './actions/tooltip';
  import Tooltip from './Tooltip.svelte';
  import type { ChipStatus } from './types';
    import Badge from './Badge.svelte';
    import type { ResourceType, YieldType } from '$lib/types';
    import { badgeFor } from '$features/detail/badge';
    import { formatNumber } from '$lib/utils';

  interface Props {
    label: string;
    costs?: Record<ResourceType, number>;
    status?: ChipStatus;
    disabled?: boolean;
    onclick?: () => void;
    caption?: Snippet;
    tooltipContent?: Snippet;
  }

  let {
    label,
    costs,
    status = 'affordable',
    disabled = false,
    onclick,
    caption,
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
    <span class="header">

      <span class="name">{label}</span>

      {#if costs}
        {#each Object.entries(costs) as [costType, costVal] }
          <span class="cost">
            <span class="num">{formatNumber(costVal)}</span>
            <Badge kind={badgeFor(costType as YieldType)} />
          </span>
        {/each}
      {/if}
    </span>

    {#if caption}
    <span class="sub">
      {@render caption()}
    </span>
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
    display: inline-flex;
    align-items: start;
    flex-direction: column;
    gap: var(--sp-1);
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

  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }

  .name {
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  .cost {
    font-size: 12px;
    font-weight: 400;
    opacity: .7;
    display: flex;
    gap: var(--sp-1);
    align-items: center;
  }

  .caption {
    display: block;
  }

  .chip.affordable {
    border-color: var(--ink-900);
    color: var(--ink-900);

    & .cost { opacity: 1; }
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
