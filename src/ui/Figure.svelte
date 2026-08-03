<script lang="ts">
  import type { FigureSize } from './types';

  interface Props {
    value: string;
    size?: FigureSize;
  }

  let { value, size = 'xl' }: Props = $props();
</script>

<span class={['fig', size, 'num']}>{value}</span>

<style>
  .fig {
    color: var(--ink-900);
    font-weight: 600;
    line-height: 1;
  }

  .fig.xl   { font-size: var(--fs-xl); }
  .fig.lg   { font-size: var(--fs-lg); }
  .fig.md   { font-size: var(--fs-md); }
  .fig.base { font-size: var(--fs-base); }
</style>
