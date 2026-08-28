<script lang="ts">
  /**
   * The clock, and what it clears. The batch line is written as a conversion
   * even though it is 1:1 today — that arrow is where a karma-to-red ratio would
   * show, and it is the one balance knob the engine deliberately does not have.
   *
   * Two bars, and the difference matters: the sweep is this pulse, the meter
   * under it is every pulse so far.
   */
  import { Badge, Figure, Meter, Section, SweepBar } from '$ui';
  import type { Listener } from '$lib/emission';
  import { refinery } from '$lib/refinery.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f } from '$lib/utils';

  /** The countdown wants a clock of its own — `nextAt` alone never re-reads. */
  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 100);

    return () => clearInterval(id);
  });

  const nextIn = $derived(Math.max(0, (refinery.nextAt - now) / 1000));

  /** Both piles, so it reads against the arriving rate rather than half of it. */
  const cleared = $derived(refinery.clearedPerSecond);

  const intake = $derived(refinery.batch * 2);

  /** The clock keeps pulsing unstaffed, but a sweep to nowhere is a lie. */
  const isIdle = $derived(refinery.workers <= 0);

  const subscribe: (fn: Listener) => () => void = (fn) => {
    const wrapped: Listener = (detail) => { if (!isIdle) fn(detail); };
    refinery.addListener('queue', wrapped);

    return () => refinery.removeListener('queue', wrapped);
  };
</script>

<Section label="Refining" highlighted={spotlight.isLit('refinery')}>
  {#snippet aside()}
    <span class="level">level {f(refinery.level)}</span>
  {/snippet}

  <div class="rate">
    <Figure value={f(cleared)} size="xxl" />
    <span class="unit">karma/s<br>cleared</span>
  </div>

  <div class="clock">
    <SweepBar {subscribe} width="100%" height="10px" />
    <span class="next">{isIdle ? 'idle' : `next ${nextIn.toFixed(1)}s`}</span>
  </div>

  <div class="progress">
    <div class="track">
      <Meter value={refinery.levelProgress} height="6px" />
    </div>
    <span class="next">{f(refinery.exp)} / {f(refinery.expToNext)}</span>
  </div>

  <div class="batch">
    <span class="num">{f(intake)} karma</span>
    <span class="arrow">→</span>
    <Badge kind="red" />
    <span class="num">{f(intake)} Crimson</span>
  </div>

  <p class="note">{isIdle ? 'Unstaffed — nothing to clear.' : 'Pulses on its own cadence.'}</p>
</Section>

<style>
  .rate {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }

  .unit {
    font-size: var(--fs-sm);
    line-height: 1.2;
    color: var(--ink-500);
  }

  .clock,
  .progress {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }

  /* Subordinate to the sweep above it: thinner, and it never animates. */
  .progress {
    margin-top: calc(var(--sp-2) * -1);
  }

  .track {
    flex: 1;
    min-width: 0;
  }

  .level,
  .next {
    flex: none;
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-500);
  }

  .batch {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-base);
    min-width: 0;
  }

  .batch .num {
    font-weight: 600;
    color: var(--ink-900);
  }

  .arrow {
    margin-inline: var(--sp-2);
    color: var(--ink-300);
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
