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
  }

  let { kind, value, size = 'xl', muted = false }: Props = $props();
</script>

<span class="value">
  <Badge {kind} />
  <Figure {value} {size} {muted} />
</span>

<style>
  .value {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }
</style>
