<script lang="ts">
  /**
   * State, not quantity. How far the unpaired difference has carried you off
   * centre, and where the door out of this world sits. The bars say how big the
   * piles are; nothing here repeats that.
   *
   * The track is deliberately not to scale — see `BOW`. Lengths here are not
   * comparable to each other, which is the price of making the gate legible;
   * the figure under the track is the number of record, the slug only a place.
   */
  import Label from './Label.svelte';
  import { formatExcess } from './format';

  interface Props {
    /** Signed excess, 1 = nothing held pairs. Negative is Burden. */
    value: number;
    /** The first-harvest gate, a magnitude — the planet asks for |excess| under it. */
    gate?: number;
    /**
     * The two ends' own words. The meter draws a scale and does not know what
     * its directions are called: `$ui` never reaches into `$lib`, so the
     * vocabulary arrives as a prop and stays labels.ts's to own.
     */
    sides?: { negative: string; positive: string };
  }

  let { value, gate, sides }: Props = $props();

  /** The reading is a share, so the ends are its own: a pile at zero, both ways. */
  const SPAN = 1;

  /**
   * How hard the scale bows. 0 is linear; higher hands more of the track to the
   * small readings near centre. The whole live question of this meter is a gate
   * a few percent wide, and on a linear ±100% track that door is a hairline you
   * cannot see yourself approach — while the far half, where every value means
   * the same thing (nowhere near leaving), spends most of the width saying it.
   *
   * What sets the ceiling is `TICKS`, not the curve: past about 25 the outer
   * marks slide into the track's end and the ruler stops being readable there.
   * Bow harder than this and the 75% tick should go with it.
   */
  const BOW = 25;

  /** Log, so the interval per pixel grows steadily outward instead of stepping. */
  const bow = (u: number) => Math.log1p(BOW * u) / Math.log1p(BOW);

  /**
   * Position on the track, in percent. Bowed on the magnitude and mirrored, so
   * the two sides stay each other's reflection and zero stays dead centre.
   */
  const at = (x: number) => {
    const clamped = Math.max(-SPAN, Math.min(SPAN, x)) / SPAN;

    return `${(0.5 + Math.sign(clamped) * bow(Math.abs(clamped)) * 0.5) * 100}%`;
  };

  /**
   * Where the ruler is marked, as magnitudes mirrored onto both sides. Round
   * quarters rather than a doubling series: these are read to *place* something
   * — the gate sits between 10 and 25 — and on the bowed scale they happen to
   * fall at near-even distances, which is the scale showing its own work.
   */
  const TICKS = [0.1, 0.25, 0.5, 0.75];

  const isComfort = $derived(value > 0);

  const slugFrom = $derived(isComfort ? at(0) : at(value));
  const slugTo = $derived(isComfort ? at(value) : at(0));

  /** A magnitude: the lit end word is what says which way, so the sign would too.
      Shared with the plain figure the header shows before this meter is revealed —
      one shape, so the reading does not change when the scale arrives under it. */
  const figure = $derived(formatExcess(value));
</script>

<div class="excess">
  <!-- Carries the figures' own strut, so the track can sit on their baseline. -->
  <div class="band">
    <div class="track">
    <!-- First, so everything else draws over them: the ruler is ground, not a
         mark on the reading. -->
    {#each TICKS as tick (tick)}
      <span class="tick" style:left={at(-tick)}></span>
      <span class="tick" style:left={at(tick)}></span>
    {/each}

    <span
      class={['slug', isComfort ? 'pos' : 'neg']}
      style:left={slugFrom}
      style:right="calc(100% - {slugTo})"
    ></span>

    <!-- The gate is |excess| under a threshold, so it is a doorway spanning
         both sides, never one tick on one side. One hairline fork above the
         track: the span is the opening, the legs are its posts. -->
    {#if gate !== undefined}
      <span class="fork" style:left={at(-gate)} style:right="calc(100% - {at(gate)})"></span>

      <!-- Sat on top of its own fork, not on the rail below: the gate is a mark
           on the scale, and naming it where it is drawn keeps the line under the
           track free for the reading. Centred on the track because the fork is
           symmetric about zero, so the track's middle is the fork's middle. -->
      <span class="gate-tag">
        <Label text="Gate" size="caption" classValue="tag" />
        <span class="num">±{Math.round(gate * 100)}%</span>
      </span>
    {/if}

    <span class="zero" style:left={at(0)}></span>
    <!-- <span class="wall start"></span>
    <span class="wall end"></span> -->
    </div>
  </div>

  <!-- The scale's two ends and, between them, where you stand on it. The words
       sit at the ends they name rather than beside the figure, so the row reads
       as the track's own footing; the end you are on takes the ink and the other
       stays back, which is what makes the bare magnitude in the middle legible
       without a sign. At dead centre neither is lit — there is no side yet. -->
  <div class="readout">
    {#if sides}
      <span class="end">
        <Label text={sides.negative} size="caption" tone={value < 0 ? 'active' : 'inactive'} />
      </span>
    {/if}

    <span class="reading value">
      <span class="num">{figure}</span>
    </span>

    {#if sides}
      <span class="end far">
        <Label text={sides.positive} size="caption" tone={value > 0 ? 'active' : 'inactive'} />
      </span>
    {/if}
  </div>
</div>

<style>
  .excess {
    display: flex;
    flex-direction: column;
    gap: var(--gap-caption);
    width: var(--meter-track);
    min-width: 0;
  }

  /* How the bar lands on the figures' baseline without a tuned offset. The
     wrapper's strut is the neighbouring figure's own size, and an inline-block
     with no line boxes of its own takes its bottom margin edge as its baseline —
     so `vertical-align: baseline` rests the track *on* that line. With the same
     --gap-caption below it that a figure leaves above its caption, aligning the
     row on its last baseline lines the bar up with the numbers for free. */
  .band {
    font-size: var(--meter-figure, var(--fs-xl));
    line-height: 1;
  }

  /* In flow, and it has to be. This used to float below the track so its big
     figures would not stretch the row; at caption size there is nothing to keep
     out of the way, and being in flow is what makes the readout the meter's last
     baseline — which is what the row aligns on, instead of on whatever baseline
     a hand-tuned padding happened to reach.
     The track's walls, gate and zero are all absolute, so nothing the meter
     draws above or below its 6px band moves this line.

     A grid rather than a flex line, so the reading stays over the zero mark by
     construction while the two end words hold the shoulders either side of it.
     The shoulders floor at zero: the figures are `nowrap` and would otherwise
     push the centre off the mark instead of letting themselves be crowded. */
  .readout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: baseline;
    gap: var(--sp-4);
  }

  /* Flex, not a bare inline span, and that is the whole alignment fix. As an
     inline box its line box carried the *inherited* 14px strut, so the readout's
     box ran a good half-line below 8.5px text and no amount of aligning the
     boxes could put this caption on the same baseline as the ones beside it.
     Blockified, the box is exactly the text. */
  .reading {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 5px;
    white-space: nowrap;
  }

  /* The figure keeps its ink where the tag beside it recedes: the caption names
     the reading, the number *is* it. Same size, so the pair still reads as one
     line on the band's caption rail. */
  .reading .num {
    font-size: var(--fs-caption);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-900);
  }

  /* Explicit, so the reading holds the middle column whether or not the two end
     words are there to be auto-placed around it. */
  .value {
    grid-column: 2;
  }

  /* The ends take the row's shoulders and face outward, each hard against the
     end of the track it names. */
  .end {
    display: flex;
    min-width: 0;
  }

  .end.far {
    justify-self: end;
  }

  /* Above the fork, centred on the track — the fork's own middle, since it is
     symmetric about zero. Its own caption size and line-height: the band around
     it is set at the karma figures' size, and inheriting that strut would float
     the tag well clear of the mark it belongs to. */
  .gate-tag {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 9px);
    translate: -50% 0;
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: var(--fs-caption);
    line-height: 1;
    white-space: nowrap;
  }

  /* The gate recedes: it is the condition, not the reading. */
  .gate-tag .num {
    font-size: var(--fs-caption);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-200);
  }

  .track {
    position: relative;
    display: inline-block;
    vertical-align: baseline;
    width: 100%;
    height: 6px;
    background: var(--line-100);
  }

  /* Both edges, and slower than a control's own answer: the slug is a reading
     drifting under you, not a response to a press. The figure below still snaps —
     it is the number of record, and it must not wait for the bar. */
  .slug {
    position: absolute;
    top: 0;
    bottom: 0;
    display: block;
    transition: left var(--t-slow), right var(--t-slow);
  }

  @media (prefers-reduced-motion: reduce) {
    .slug { transition: none; }
  }

  /* Under the slug on purpose. One side is hatched near-black and the other
     hatched white, so no single ink reads on both — a ruler that survived the
     slug would have to be a third value fighting the hatch. Marks you can still
     see are ground you have not reached; the slug swallowing its own is the
     reading, not a loss, and the untouched side keeps the full scale. */
  .tick {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--line-300);
  }

  .slug.neg { background: var(--hatch-neg-bar); }

  .slug.pos {
    background: var(--hatch-pos-bar);
    box-shadow: var(--hatch-pos-edge);
  }

  /* The drawn gate is `.fork`, never `.gate` — the readout's gate *reading* is a
     `.gate` too, and sharing the word here silently made it absolute and threw
     it out of the meter entirely. One class, one meaning. */
  .fork,
  .zero,
  .wall {
    position: absolute;
    display: block;
  }

  /* Clear of the track, not resting on it: the doorway is a mark on the scale
     above the reading, so it sits in grey a few pixels off the bar rather than
     competing with the slug's own ink. */
  .fork {
    top: -7px;
    height: 4px;
    box-sizing: border-box;
    border: 1px solid var(--ink-300);
    border-bottom: 0;
  }

  .zero {
    top: -4px;
    bottom: -4px;
    width: 1px;
    background: var(--ink-900);
  }

  .wall {
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: var(--ink-900);
  }

  .wall.start { left: 0; }
  .wall.end { right: 0; }
</style>
