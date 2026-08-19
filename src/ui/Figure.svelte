<script lang="ts">
  import type { FigureSize } from './types';

  interface Props {
    value: string;
    size?: FigureSize;
    /** A reading that is drawn but empty — a rung of the ladder not yet reached. */
    muted?: boolean;
  }

  let { value, size = 'xl', muted = false }: Props = $props();
</script>

<span class={['fig', size, 'num', { muted }]}>{value}</span>

<style>
  .fig {
    color: var(--ink-900);
    font-weight: 600;
    line-height: 1;
  }

  .fig.muted { color: var(--ink-300); }

  .fig.xl   { font-size: var(--fs-xl); }
  .fig.lg   { font-size: var(--fs-lg); }
  .fig.md   { font-size: var(--fs-md); }
  .fig.base { font-size: var(--fs-base); }
</style>
