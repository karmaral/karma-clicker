<script lang="ts">
  /**
   * The lean track, bent into a half-circle. 12 o'clock is even and a quadrant
   * either way is a hard detent, so the wedges are the band this cohort wanders
   * across and the needle is where its aim actually sits inside them.
   *
   * Zero wants no mark: the wedges meet at it, and the one state with no wedge at
   * all is the one where the needle already points straight up.
   */
  import type { Props as TippyProps } from 'tippy.js';
  import { Tooltip, tooltip } from '$ui';

  interface Props {
    /** How far into each polarity this cohort reaches, 0…1 of a hard detent. */
    negativeReach: number;
    positiveReach: number;
    /** Where the aim is now, −1…1 on the reaches' scale. */
    needle: number;
    /** The aim is the cohort's, not yours — the line greys out to say so. */
    unaimable?: boolean;
    /** The word, now the hover rather than a line of text under the dial. */
    lean: string;
  }

  let { negativeReach, positiveReach, needle, unaimable = false, lean }: Props = $props();

  /** A quadrant is a hard detent. Everything on the dial is this one conversion. */
  const QUADRANT = 90;

  const negative = $derived(negativeReach * QUADRANT);
  const positive = $derived(positiveReach * QUADRANT);
  const angle = $derived(needle * QUADRANT);

  let hintElem: HTMLElement | undefined = $state();
  const hintOptions: Partial<TippyProps> = { placement: 'top', delay: [120, 0], interactive: false };
</script>

<div
  class="lean"
  role="img"
  aria-label="Lean: {lean}"
  {@attach tooltip({ content: hintElem, options: hintOptions })}
>
  <div class="hint-wrapper" bind:this={hintElem}>
    <Tooltip hint>{lean}</Tooltip>
  </div>
  {#if negative > 0}
    <span class="wedge neg" style:--sweep="{negative}deg" style:--from="-{negative}deg"></span>
  {/if}
  {#if positive > 0}
    <span class="wedge pos" style:--sweep="{positive}deg" style:--from="0deg"></span>
  {/if}

  <span class="plate"></span>

  <!-- The light hatch needs a terminus the way it does on a flat track; the dark
       one is its own. -->
  {#if positive > 0}
    <span class="edge" style:rotate="{positive}deg"></span>
  {/if}

  <span class={['needle', { unaimable }]} style:rotate="{angle}deg"></span>
</div>

<style>
  .lean {
    position: relative;
    width: 36px;
    height: 18px;
    flex: none;
    margin-inline: auto;
    overflow: hidden;
  }

  /* A full circle hung below the fold — the container keeps its top half, and the
     conic mask cuts the sector out of that. The only shape primitive here that
     takes an arbitrary angle. */
  .wedge {
    position: absolute;
    top: 0;
    left: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    mask-image: conic-gradient(from var(--from), #000 0deg var(--sweep), #0000 var(--sweep));
  }

  .wedge.neg { background: var(--hatch-neg); }
  .wedge.pos { background: var(--hatch-pos); }

  /* Outline, never a fill: a hovered row is --surface-alt, which is what a filled
     track would have been. */
  .plate {
    position: absolute;
    inset: 0;
    border: 1px solid var(--line-200);
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  }

  .edge,
  .needle {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 1px;
    margin-left: -0.5px;
    transform-origin: bottom center;
  }

  .edge {
    height: 18px;
    background: var(--line-300);
  }

  .needle {
    height: 17px;
    background: var(--ink-900);
  }

  .needle.unaimable { background: var(--ink-300); }

  .hint-wrapper { pointer-events: none; }
</style>
