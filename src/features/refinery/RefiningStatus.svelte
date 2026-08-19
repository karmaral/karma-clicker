<script lang="ts">
  /**
   * The clock, and what it clears. The batch line is written as a conversion
   * even though it is 1:1 today — that arrow is where a karma-to-red ratio would
   * show, and it is the one balance knob the engine deliberately does not have.
   */
  import { Badge, Figure, Section, SweepBar } from '$ui';
  import type { Listener } from '$lib/emission';
  import { refinery } from '$lib/refinery.svelte';
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

  const subscribe: (fn: Listener) => () => void = (fn) => {
    refinery.addListener('queue', fn);

    return () => refinery.removeListener('queue', fn);
  };
</script>

<Section label="Refining">
  <div class="rate">
    <Figure value={f(cleared)} />
    <span class="unit">karma/s<br>cleared</span>
  </div>

  <div class="clock">
    <SweepBar {subscribe} width="100%" height="10px" />
    <span class="next">next {nextIn.toFixed(1)}s</span>
  </div>

  <div class="batch">
    <span class="num">{f(intake)} karma</span>
    <span class="arrow">→</span>
    <Badge kind="red" />
    <span class="num">{f(intake)} Crimson</span>
  </div>

  <p class="note">Pulses on its own cadence.</p>
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

  .clock {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }

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
