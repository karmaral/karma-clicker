<script lang="ts">
  import Badge from './Badge.svelte';
  import Figure from './Figure.svelte';
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
  <Badge {kind} />
  <Figure {value} {size} {muted} />
  {#if rate}
    <span class={['rate num']}>
      +{rate}<span class="unit">/s</span>
    </span>
  {/if}
</span>

<style>
  .value {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  .rate {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-500);
    margin-left: var(--sp-1);
  }

  .unit {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--ink-300);
    margin-left: 1px;
  }
</style>
