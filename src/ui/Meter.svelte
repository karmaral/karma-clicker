<script lang="ts">
  import type { MeterAlign, MeterFill, MeterTick } from './types';

  interface Props {
    value: number;
    max?: number;
    fill?: MeterFill;
    align?: MeterAlign;
    height?: string;
    track?: boolean;
    ticks?: MeterTick[];
  }

  let {
    value,
    max = 100,
    fill = 'ink',
    align = 'start',
    height = '8px',
    track = true,
    ticks = [],
  }: Props = $props();

  const pct = (n: number) => `${Math.max(0, Math.min(1, n / max)) * 100}%`;

  const fillClass = $derived(
    fill === 'pos' ? 'karma-pos' : fill === 'neg' ? 'karma-neg' : 'ink'
  );
</script>

<div class={['meter', { track }]} style:height>
  <span class={['fill', fillClass, align]} style:width={pct(value)}></span>
  {#each ticks as tick (tick.at)}
    <span class={['tick', { strong: tick.strong }]} style:left={pct(tick.at)}></span>
  {/each}
</div>

<style>
  .meter {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  .meter.track {
    background: var(--line-100);
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    display: block;
  }

  .fill.end {
    inset: 0 0 0 auto;
  }

  .fill.ink {
    background: var(--ink-400);
  }

  .tick {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: var(--ink-200);
  }

  .tick.strong {
    background: var(--ink-900);
  }
</style>
