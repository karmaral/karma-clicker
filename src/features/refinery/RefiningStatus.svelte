<script lang="ts">
  /**
   * The clock, and what it refines. The headline is the *forecast* rate —
   * coverage times short-pile income, across both poles — so it moves only on a
   * real event (an upgrade, a tilt, a cohort) and never with the pile, which is
   * the one property a headline needs.
   *
   * Not coverage: a share answers "is this good" but is not a reward, and the
   * Coverage panel below owns that reading outright — it was being said twice.
   *
   * Karma refined is the headline and Crimson is the line under it, because the
   * headline is what the *engine* did and the yield is what it paid. The two
   * figures come apart on `ratio` now — the level's own axis, not coverage's —
   * so the headline stays a straight karma-cleared reading and Crimson is
   * where the level's work actually shows.
   *
   * The two are on different bases and say so: karma across both poles, crimson
   * per pile and worded "matched". They are not meant to divide into each other
   * by eye — `ratio` sits between them anyway.
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

  /** Both poles, forecast — what the refinery takes in per second. */
  const karma = $derived(refinery.perSecond * 2);

  /**
   * What that pays out, *per pile* — the same figure the header reads, so one
   * crimson rate exists in the game rather than two that differ by a factor of
   * two and never say why. Halving it costs nothing in meaning, because crimson
   * only ever arrives paired: one from each pile, always the same amount. That
   * is what "matched" says, and it is the word `GRADE_SOURCES` already uses for
   * the crimson Ochre is bought with.
   *
   * The karma headline above stays across both poles on purpose — that one is
   * what the engine *drew*, and karma has no pairing until it gets here.
   */
  const crimson = $derived(refinery.crimsonPerSecond);

  /** The clock keeps pulsing unstaffed, but a sweep to nowhere is a lie. */
  const isIdle = $derived(refinery.workers <= 0);

  /** A countdown under a quarter second is not a countdown — see `ResourceEmitter`. */
  const clockLabel = $derived.by(() => {
    if (isIdle) return 'idle';
    if (refinery.isStreaming) return 'streaming';

    return `next ${nextIn.toFixed(1)}s`;
  });

  const subscribe: (fn: Listener) => () => void = (fn) => {
    const wrapped: Listener = (detail) => { if (!isIdle) fn(detail); };
    refinery.addListener('queue', wrapped);

    return () => refinery.removeListener('queue', wrapped);
  };
</script>

<Section label="Refining" highlighted={spotlight.isLit('refinery')}>
  {#snippet aside()}
    <span class="level">
      level {f(refinery.level)} 
    </span>

  {/snippet}

  <div class="rate">
    {#if isIdle}
      <Figure value="—" size="xxl" muted />
      <span class="unit">unstaffed<br>nothing to clear</span>
    {:else}
      <Figure value={f(karma)} size="xxl" />
      <span class="unit">karma/s<br>refined at this coverage</span>
    {/if}
  </div>

  <div class="clock">
    <SweepBar {subscribe} streaming={refinery.isStreaming} width="100%" height="10px" />
    <span class="next">{clockLabel}</span>
  </div>

  <div class="progress">
    <div class="track">
      <Meter value={refinery.levelProgress} height="6px" />
    </div>
    <span class="next">{f(refinery.exp)} / {f(refinery.expToNext)}</span>
  </div>

  <div class="batch">
    <Badge kind="red-both" />
    <span class="num">{f(crimson)} matched Crimson/s</span>

    <span class="ratio">×{f(refinery.ratio)} efficiency</span>
  </div>
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
    font-variant-numeric: tabular-nums;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-500);
  }

  /* The figure sizes the row, so the track is whatever it leaves — a label that
     narrows as its digits tick steals width back from the fill, and the bar walks
     backwards while the number it reports goes up. Reserved and right-aligned, so
     the track is the same track from one pulse to the next. */
  .progress .next {
    min-width: 22ch;
    text-align: right;
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
  .ratio {
    margin-left: auto;
  }
</style>
