<script lang="ts">
  import { tooltip } from './actions/tooltip';
  import Tooltip from './Tooltip.svelte';
  import type { ChipStatus } from './types';
  import type { Props as TippyProps } from 'tippy.js';
  import type { Snippet } from 'svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { IconSource } from '@steeze-ui/svelte-icon';

  interface Props {
    label: string;
    icon?: IconSource;
    status?: ChipStatus;
    disabled?: boolean;
    onclick?: () => void;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
    tooltipContent?: Snippet;
    /** A second panel, opening to the left of the first. Both or neither. */
    asideContent?: Snippet;
    /** Held at the far edge, where the row keeps its price. */
    trailing?: Snippet;
  }

  let {
    label,
    icon,
    status = 'affordable',
    disabled = false,
    onclick,
    onmouseenter,
    onmouseleave,
    tooltipContent,
    asideContent,
    trailing,
  }: Props = $props();

  let tooltipElem: HTMLElement | undefined = $state();
  let asideElem: HTMLElement | undefined = $state();

  const DELAY = 450;
  const GAP = 12;

  /** Fixed, not a ceiling, once there is an aside — see `.chip-tooltip`. */
  const PANEL_WIDTH = 250;
  const ASIDE_WIDTH = 320;

  const tooltipOptions: Partial<TippyProps> = {
    // Anchored to the chip's top-left, not below it — the rail sits at the
    // screen's own right edge, so the panel opens into the room the rail
    // doesn't have. flip disabled outright: there's no width to flip into
    // on the right, so a fallback there would only run under the rail.
    placement: 'left-start',
    delay: [DELAY, 0],
    offset: [0, GAP],
    interactive: false,
    arrow: true,
    popperOptions: { modifiers: [{ name: 'flip', enabled: false }] },
  };

  /**
   * The same corner, one panel further out: the first box's own distance, then
   * the whole of it, then a gap. A constant and not a measurement, which is what
   * the fixed `--tooltip-width` below buys — the box tippy would have to be
   * measured through does not exist until it is already open.
   */
  const asideOptions: Partial<TippyProps> = {
    placement: 'left-start',
    delay: [DELAY, 0],
    offset: [0, GAP + PANEL_WIDTH + GAP],
    interactive: false,
  };

</script>

<li>
  <button
    type="button"
    class={['chip', status]}
    {disabled}
    {onclick}
    {onmouseenter}
    {onmouseleave}
    {@attach tooltip({content: tooltipElem, options: tooltipOptions })}
    {@attach tooltip({content: asideElem, options: asideOptions, layer: 'aside' })}
  >
    {#if icon}
      <Icon src={icon} size="1.5em" />
    {/if}
    <span class="name">{label}</span>
    {#if trailing}
      <span class="trailing">{@render trailing()}</span>
    {/if}
  </button>

  <!-- The wrapper is what tippy takes, so `--tooltip-max` set here reaches
       `.tooltip` after the node is moved into the popper — inheriting from the
       chip would not, since the box ends up under `<body>`. -->
  {#if tooltipContent}
    <!-- Held at its ceiling rather than shrinking, once there is a second panel
         to sit beside: the aside's offset is that width plus a gap, and a box
         narrower than the figure it is offset by would leave a hole. -->
    <div
      class="chip-tooltip"
      bind:this={tooltipElem}
      style:--tooltip-width={asideContent ? `${PANEL_WIDTH}px` : undefined}
    >
      <Tooltip>
        <div class="tooltip-content">
          {@render tooltipContent()}
        </div>
      </Tooltip>
    </div>
  {/if}

  {#if asideContent}
    <div
      class="chip-aside"
      bind:this={asideElem}
      style:--tooltip-width="{ASIDE_WIDTH}px"
      style:--tooltip-max="{ASIDE_WIDTH}px"
    >
      <Tooltip>
        {@render asideContent()}
      </Tooltip>
    </div>
  {/if}

</li>

<style>
  li {
    list-style: none;
    padding: unset;
  }

  /* Narrower than the 320px default. A chip's panel is a name, a price and a
     sentence — at the full width the sentence ran to one long line and the
     price sat a third of the box away from the title it belongs to. This is a
     ceiling, not a width: a short panel still shrinks to its own content. */
  .chip-tooltip {
    --tooltip-max: 250px;
  }
  .chip {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: var(--sp-2);
    flex: none;
    padding: 7px var(--sp-3);
    background: var(--surface);
    border: 1px solid var(--line-300);
    white-space: nowrap;
    transition: border-color var(--t-fast), color var(--t-fast);
    --badge-size: 7px;
    --badge-gap: var(--sp-1);
  }

  .chip :global(svg) {
    flex: none;
    stroke-width: 1.5;
  }

  .name {
    color: var(--ink-300);
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 600;
    min-width: 0;
  }

  /* Pushed to the far edge and never squeezed — the label ellipses first. Left
     to inherit the chip's colour, so a price dims with the status around it. */
  .trailing {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    flex: none;
    margin-left: auto;
    padding-left: var(--sp-2);
    font-size: var(--fs-xs);
    font-weight: 600;
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

  /* Not locked, not for sale — it is granted the moment unlocks_at holds. Same
     dashed register as approaching, one ink step lighter so the two never read
     as the same wait. */
  .chip.arriving {
    border-style: dashed;
    border-color: var(--line-300);
    color: var(--ink-300);
  }
</style>
