<script lang="ts">
  /**
   * One per-second figure: what it is, how much, and what would change it. Drawn
   * by the table's head as well as its rows, so a hovered row and the total it
   * belongs to cannot disagree about how a rate looks.
   */
  import { Badge } from '$ui';
  import { f } from '$lib/utils';
  import type { YieldType } from '$types';
  import { badgeFor } from './badge';

  interface Props {
    type: YieldType;
    value: number;
    /** What a purchase would add. Green, above the figure, and only when positive. */
    delta?: number;
    /** Which way your aim is bending this rate against Even. Rows only. */
    trend?: number;
  }

  let { type, value, delta = 0, trend = 0 }: Props = $props();

  const TREND_MARKS: Record<number, string> = { [-1]: '▼', 0: '', 1: '▲' };

  const TREND_TITLES: Record<number, string> = {
    [-1]: 'Your aim is holding this rate down',
    0: '',
    1: 'Your aim is lifting this rate',
  };
</script>

<span class="rate" title={TREND_TITLES[trend]}>
  <Badge kind={badgeFor(type)} />
  <span class="value num">
    +{f(value)}<span class="unit">/s</span>

    {#if trend}
      <span class={['trend', { down: trend < 0 }]}>{TREND_MARKS[trend]}</span>
    {/if}

    {#if delta > 0}
      <span class="delta num">+{f(delta)}</span>
    {/if}
  </span>
</span>

<style>
  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  .value {
    font-size: var(--fs-sm);
    font-weight: 600;
    font-stretch: var(--wd-figure);
    line-height: 1;
    color: var(--ink-900);
    position: relative;
  }

  .unit {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--ink-300);
    margin-left: 1px;
  }

  /* Opposite ends of the same line above the figure, so the arrow and the
     purchase's gain never land on each other. */
  .trend {
    position: absolute;
    left: 0;
    top: 12px;
    width: 7px;
    font-size: 7px;
    line-height: 1;
    color: var(--ink-400);
    text-align: left;
  }
  .trend.down {
    top: 12px;
  }

  .delta {
    position: absolute;
    left: .5px;
    top: -11px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    color: var(--status-gain);
    white-space: nowrap;
  }
</style>
