<script lang="ts">
  /**
   * A bar swept once per emission. Knows nothing about what emits — the caller
   * hands it a subscribe closure and gets its own teardown back.
   *
   * Two readings, because a fast clock is not a fast version of a slow one. A
   * clock you can watch fills to its landing and starts again; a stream has no
   * landing to fill to, so it is drawn full with a light band running across it
   * and never subscribes at all. That last part is the point of the split: at
   * stream speed the sweep was cancelling and restarting an animation twenty
   * times a second to draw something the eye reads as one flat bar.
   */
  import type { Listener } from '$lib/emission';

  interface Props {
    subscribe: (fn: Listener) => () => void;
    /** Paying by the tick rather than by the life. See `ResourceEmitter`. */
    streaming?: boolean;
    /**
     * Where the current cycle already stands, for a bar mounted mid-sweep — a
     * screen that stays alive off-camera (`Screen`) resumes to a cycle already
     * running, and the next `queue` event may be minutes off. Read once, at
     * mount: a reactive value here would re-seed the bar on every tick.
     */
    resume?: { duration: number; remaining: number };
    width?: string;
    height?: string;
  }

  let { subscribe, streaming = false, resume, width = '12rem', height = '3px' }: Props = $props();

  let bar = $state<HTMLSpanElement>();

  $effect(() => {
    // Nothing to listen for: a stream's own animation is the CSS below, running
    // on its own clock rather than on the emitter's.
    if (streaming) return;

    /**
     * From wherever the cycle already stands to full. A fresh queue has all of
     * its wait left and so starts at 0; a re-armed one — an upgrade shortening
     * the clock mid-cycle, see `ResourceEmitter.retime` — keeps the share it has
     * already served rather than snapping back to empty.
     */
    const draw = (duration: number, remaining: number) => {
      if (!duration || remaining <= 0 || !bar) return;

      const startPct = Math.max(0, Math.min(1, 1 - remaining / duration)) * 100;

      bar.getAnimations().forEach((animation) => animation.cancel());
      bar.animate(
        [{ width: `${startPct}%` }, { width: '100%' }],
        { duration: remaining, easing: 'linear' },
      );
    };

    const sweep = (detail?: Record<string, unknown>) => {
      const duration = Number(detail?.duration ?? 0);

      draw(duration, Number(detail?.remaining ?? duration));
    };

    if (resume) draw(resume.duration, resume.remaining);

    return subscribe(sweep);
  });
</script>

<div class={['sweep', { streaming }]} style:width style:height>
  {#if streaming}
    <span class="flow"></span>
  {:else}
    <span class="progress" bind:this={bar}></span>
  {/if}
</div>

<style>
  .sweep {
    display: inline-flex;
    background: var(--line-100);
  }
  .progress {
    background: var(--ink-400);
  }

  /* Full, because a stream is always mid-payout — the track itself carries the
     "working" reading and the band over it carries the speed.

     Filled in the *progress* ink rather than a dim one, so a bar that starts
     streaming reads as one that has stopped coming back to empty. The band over
     it is light for the same reason it cannot be dark: there is no unfilled
     track left for a dark mark to be mistaken for. */
  .sweep.streaming {
    position: relative;
    overflow: hidden;
    background: var(--ink-400);
  }

  /* Soft at both ends, so what crosses the bar is a brightening rather than a
     thing moving.

     Slow on purpose, and slower than a loading bar would be: this one is not
     waiting for anything. A quick sweep says *hurry up*, where the cohort under
     it has already arrived and is simply working. The same seconds the swarm's
     own wave takes — see `boltWave`.

     The band is exactly the track's width and travels exactly its own width in
     each direction, so the sweep never needs recomputing — **the two middle
     stops are the only knob.** They are the lit band, as a share of the track:
     30/70 is a light 40% with a 30% falloff either side. Widen them together to
     fatten it, move them apart to soften the edges.

     Ramping to the track's own ink rather than to `transparent` is what keeps
     the falloff clean: a gradient to `transparent` interpolates toward
     transparent *black*, so a light band over a mid ink dips muddy on its way
     out instead of just fading. No alpha here, so there is no dead zone. */
  .flow {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      var(--ink-400) 0%,
      var(--line-100) 50%,
      var(--ink-400) 100%
    );
    animation: flow 2.4s linear infinite;
  }

  /* Off one edge to off the other. Fixed, because the band is the track's width
     — the old 167% was this same distance worked out for a 60% band, which is
     the coupling that made the width impossible to change on its own. */
  @keyframes flow {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
</style>
