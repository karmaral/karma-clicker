<script lang="ts">
  import Badge from './Badge.svelte';
  import Figure from './Figure.svelte';
  import Rate from './Rate.svelte';
  import type { BadgeKind, FigureSize } from './types';

  interface Props {
    kind: BadgeKind;
    value: string;
    size?: FigureSize;
    /** Greys the figure only — the badge keeps its hue, so the row still reads. */
    muted?: boolean;
    /** Per-second income, already formatted. Omit to leave the figure bare. */
    rate?: string;
  }

  let { kind, value, size = 'xl', muted = false, rate }: Props = $props();
</script>

<span class="value">
  <span class="badge"><Badge {kind} /></span>
  <Figure {value} {size} {muted} />
  {#if rate}
    <span class="rate"><Rate value={rate} /></span>
  {/if}
</span>

<style>
  /* Baseline, not centre: the rate is text beside text, and a figure set at `xl`
     is more than twice its height — centred, the rate floated in the middle of a
     number it is supposed to be standing on. `last baseline` rather than
     `baseline` so the row still anchors on its bottom line when what sits beside
     the figure is a stack; with one line the two are the same thing. */
  .value {
    display: flex;
    align-items: last baseline;
    gap: var(--badge-gap);
  }

  /* The one part that is not text. Out of the baseline group, so a mark with no
     baseline of its own cannot be given one synthesised from its bottom edge —
     which would hang it off the figure's baseline instead of beside the number. */
  .badge {
    display: flex;
    align-self: center;
    flex: none;
  }

  /* Placement only — the rate draws itself, and the baseline now does the
     vertical work a pixel of padding used to. */
  .rate {
    margin-left: var(--sp-1);
  }
</style>
