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
  }

  let { type, value, delta = 0 }: Props = $props();
</script>

<span class="rate">
  <span class="badge"><Badge kind={badgeFor(type)} /></span>
  <span class="value num">
    +{f(value)}<span class="unit">/s</span>

    {#if delta > 0}
      <span class="delta num">+{f(delta)}</span>
    {/if}
  </span>
</span>

<style>
  /* Baselined on the number, with the badge centred out of the group — as in
     `Value` — so a row can set a rate on a bigger figure's baseline. */
  .rate {
    display: flex;
    align-items: baseline;
    gap: var(--badge-gap);
  }

  .badge {
    display: flex;
    align-self: center;
    flex: none;
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
