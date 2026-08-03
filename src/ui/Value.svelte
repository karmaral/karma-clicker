<script lang="ts">
  import Badge from './Badge.svelte';
  import Figure from './Figure.svelte';
  import type { BadgeKind, FigureSize } from './types';

  interface Props {
    kind: BadgeKind;
    value: string;
    size?: FigureSize;
  }

  let { kind, value, size = 'xl' }: Props = $props();
</script>

<span class="value">
  <Badge {kind} />
  <Figure {value} {size} />
</span>

<style>
  .value {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }
</style>
