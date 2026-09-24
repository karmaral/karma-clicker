<script lang="ts">
  /**
   * The wave, docked to the viewport rather than boxed in its own `Section`. Well
   * under `DensityWave`'s height. The head above it is the age's clock — what
   * each half of the wobble pays, how many ages and which phase, and how long it
   * runs. Every *other* phase's closing time is still one hover away.
   *
   * `H` is a fixed pixel height, not derived from the viewBox `W`: with
   * `preserveAspectRatio="none"` the two are independent, so the strip stays the
   * same height regardless of how many phases a planet has.
   *
   * The viewBox is the measured box in CSS pixels rather than a fixed hundred
   * per phase, so one user unit is one of them and every mark can be snapped
   * where it is written — see `createPixelGrid`. A stretched axis cannot be:
   * whatever you place on the grid in user units lands wherever the scale
   * factor leaves it, which for a hairline is a soft double line half the time.
   */
  import { Badge, Label, Tooltip, createPixelGrid, tooltip } from '$ui';
  import { f, formatSpan } from '$lib/utils';
  import { getAgesLabel, getPhaseLabel } from '$lib/labels';
  import { getWaveBias } from '$lib/wave';
  import { buildWavePath, H as WAVE_H, markerY as markerYAt } from './wave-math';
  import type { Phase } from './types';

  interface Props {
    phases: Phase[];
    current: number;
    position: number;
    /**
     * Where the live re-aim penalty runs out, on this strip's own 0…1 axis. The
     * penalty is priced in phases, so the phase clock is where it is drawn.
     * Already normalised by the screen: the strip knows no planets.
     */
    settleAt?: number;
    /** The same mark for an aim not yet confirmed — where it *would* run out. */
    draftAt?: number;
    /**
     * Where the pointed cohort's next life lands. Absent unless a row is being
     * read — see `extended`, and `DetailsScreen`, which normalises it.
     */
    yieldAt?: number;
    /** Whole ages lived, for the clock's count. */
    agesLived: number;
    /** The wave is a clock: every phase is the same length. Ms. */
    phaseMs: number;
    /** And how much of the one you are in is left. Ms. */
    remainingMs: number;
  }

  let {
    phases, current, position, settleAt, draftAt, yieldAt, agesLived, phaseMs, remainingMs,
  }: Props = $props();

  const H = 40;
  const scaleY = H / WAVE_H;

  /** The device pixel grid the strip is drawn on — see the note above. */
  const grid = createPixelGrid();

  const W = $derived(grid.width);

  /**
   * A fill's edge: the mark itself, since a fill starts on it rather than
   * straddling it. Takes the strip's own 0…1 axis, which is what every caller
   * already has — phases are `i / phases.length` along it.
   */
  const edge = (u: number) => grid.snap(u * W);

  /**
   * A hairline's x. An SVG stroke is centred on its coordinate, so this is half
   * a hair past the mark — which puts the line's *left edge* on it, the same
   * convention the excess and alignment tracks draw their marks by.
   */
  const mark = (u: number) => edge(u) + grid.hair / 2;

  /**
   * A dot's left, centred on the hairline it caps and snapped itself: an odd
   * dot on a one-pixel line then shares that line's middle pixel instead of
   * spreading its ink over the two either side of it.
   */
  const dotAt = (u: number, size: number) => grid.snap(mark(u) - size / 2);

  /**
   * The planet on the wave. Well clear of `--badge-size`: the head's two karma
   * badges are 9px rings a few pixels above this, and at 10 the playhead read as
   * a third one of them rather than as the world riding its own clock.
   *
   * ⚠ 14 is the ceiling, and the curve sets it. The bezier's crest sits 5.2px
   * below the top of a 40px strip, so a dot wider than that begins to push into
   * the head's line at the top of a light phase. Grow the strip first.
   */
  const MARKER = 14;

  /** Smaller than the badges rather than larger — see the note at the mark. */
  const LANDING = 5;

  const path = $derived(buildWavePath(phases.length, W, 1));
  const markerY = $derived(markerYAt(phases.length, position, 1) * scaleY);

  /** Where the wave itself stands at the landing — the line hangs off the curve. */
  const yieldY = $derived(
    yieldAt === undefined ? undefined : markerYAt(phases.length, yieldAt, 1) * scaleY,
  );

  /**
   * Live, not authored — excess widens the pair, so the legend moves with it.
   * Both kinds stay keyed for the tooltips; the head reads only the live one.
   */
  const BIAS = $derived.by(() => {
    const { biasWith, biasAgainst } = getWaveBias();

    return {
      light: { negative: biasAgainst, positive: biasWith },
      dense: { negative: biasWith, positive: biasAgainst },
    };
  });

  const currentPhase = $derived(phases[current]);

  let tooltipElems: (HTMLElement | undefined)[] = $state([]);
</script>

{#if currentPhase}
  <div class="head">
    <!-- A semaphore: both words are always drawn and the live one lights. The
         badges below them never move — dense is the negative side, light the
         positive — so only the figures turn, and the turn is the reading. -->
    <div class="bias">
      <Label text="dense" size="sm" tone={currentPhase.kind === 'dense' ? 'active' : 'inactive'} />
      <Label text="light" size="sm" tone={currentPhase.kind === 'light' ? 'active' : 'inactive'} />
      <span class="pair"><Badge kind="neg" />×{f(BIAS[currentPhase.kind].negative, 2)}</span>
      <span class="pair"><Badge kind="pos" />×{f(BIAS[currentPhase.kind].positive, 2)}</span>
    </div>

    <div class="clock">
      <span>{getAgesLabel(agesLived)} · {getPhaseLabel(current, phases.length)}</span>
      <span>{formatSpan(phaseMs)} phase · {formatSpan(remainingMs)} left</span>
    </div>
  </div>
{/if}

<!-- Nothing is drawn until the box has been measured: every mark is a pixel
     offset into it, and the axis it is placed on is the measurement itself. -->
<div
  class="strip"
  style:height="{H}px"
  style:--hair="{grid.hair}px"
  style:--marker="{MARKER}px"
  style:--landing="{LANDING}px"
  {@attach grid.measure}
>
  {#if W > 0}
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
    {#each phases as _, i (i)}
      {#if i % 2 === 1 || i === current}
        <rect
          x={edge(i / phases.length)} y="0"
          width={edge((i + 1) / phases.length) - edge(i / phases.length)} height={H}
          fill="var(--ink-900)"
          opacity={i === current ? 0.05 : 0.025}
        />
      {/if}
      {#if i > 0}
        <line
          x1={mark(i / phases.length)} y1="0" x2={mark(i / phases.length)} y2={H}
          stroke="var(--line-100)" stroke-width={grid.hair}
        />
      {/if}
    {/each}

    <!-- Half a hair below the midline, for the reason every vertical mark is
         half a hair right of its own: the stroke is centred on what it is given.
         The strip's top is not snappable — it moves with the scroll, and by
         fractions of a pixel on a trackpad — so this rides the viewBox instead,
         which is right whenever the box itself lands on the grid. -->
    <line
      x1="0" y1={H / 2 + grid.hair / 2} x2={W} y2={H / 2 + grid.hair / 2}
      stroke="var(--line-100)" stroke-width={grid.hair}
    />
    <path
      d={path} fill="none" stroke="var(--ink-900)" stroke-width={grid.hair}
      transform="scale(1 {scaleY})" vector-effect="non-scaling-stroke"
    />
    <line
      x1={mark(position)} y1="0" x2={mark(position)} y2={H}
      stroke="var(--ink-300)" stroke-width={grid.hair} stroke-dasharray="2 3"
    />

    <!-- Both solid: the playhead owns the dash, and a second dashed line would
         read as another now rather than as a deadline. Weight says which is
         which — the committed one takes the ink. -->
    {#if draftAt !== undefined}
      <line
        x1={mark(draftAt)} y1="0" x2={mark(draftAt)} y2={H}
        stroke="var(--ink-300)" stroke-width={grid.hair}
      />
    {/if}

    {#if settleAt !== undefined}
      <line
        x1={mark(settleAt)} y1="0" x2={mark(settleAt)} y2={H}
        stroke="var(--ink-900)" stroke-width={grid.hair}
      />
    {/if}

    <!-- Hung off the curve rather than run through it, and so not a deadline:
         the other three lines cross the whole strip because they are moments the
         world reaches, and this one is a moment that reaches the world. Where it
         meets the wave is the reading — that is the bias the life will land in,
         which is the half the row's own countdown cannot say.

         ⚠ It runs to the floor and not to the baseline. Lives are whole numbers
         of phases from n5 up, and a landing a whole phase out sits at the same
         point *within* its phase as the playhead does — so on the crossings the
         curve is at the baseline, and a line drawn between the two had no length
         at all. To the floor it always has some.

         The dot that caps it is HTML, beside the playhead's: its ring is a
         snapped CSS weight, and while the box is being re-measured the viewBox
         still lags the box for a frame — under `preserveAspectRatio="none"` a
         circle in here would be an ellipse for it. The dot carries the weight,
         so the line can stay a leader. -->
    {#if yieldY !== undefined}
      <line
        x1={mark(yieldAt!)} y1={yieldY} x2={mark(yieldAt!)} y2={H}
        stroke="var(--ink-300)" stroke-width={grid.hair}
      />
    {/if}

    <!-- Hit targets, not marks: a hover is a region, so these take the phase's
         true edges rather than the snapped ones. -->
    {#each phases as _, i (i)}
      <rect
        x={(i / phases.length) * W} y="0" width={W / phases.length} height={H}
        fill="transparent"
        {@attach tooltip({ content: tooltipElems[i] })}
      />
    {/each}
  </svg>

  <!-- Both dots are placed from the same `mark` their line is, so the cap sits
       on the stem rather than near it. Vertically they ride the curve, where
       there is no hairline to land on and nothing to snap to. -->
  <span
    class="marker"
    style:left="{dotAt(position, MARKER)}px"
    style:top="{markerY - MARKER / 2}px"
  ></span>

  <!-- Filled where the playhead is hollow: now is a place you are standing in,
       the landing is a point on the curve. -->
  {#if yieldY !== undefined}
    <span
      class="landing"
      style:left="{dotAt(yieldAt!, LANDING)}px"
      style:top="{yieldY - LANDING / 2}px"
    ></span>
  {/if}
  {/if}
</div>

{#each phases as phase, i (i)}
  <div class="tooltip-host" bind:this={tooltipElems[i]}>
    <Tooltip title={phase.kind === 'dense' ? 'Dense' : 'Light'}>
      <span class="hover">
        {phase.at} ·
        <span class="pair"><Badge kind="neg" />×{f(BIAS[phase.kind].negative, 2)}</span>
        <span class="pair"><Badge kind="pos" />×{f(BIAS[phase.kind].positive, 2)}</span>
      </span>
    </Tooltip>
  </div>
{/each}

<style>
  /* Last baseline, so the clock's foot reads level with the figures row. */
  .head {
    display: flex;
    align-items: last baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--ink-500);
    margin-bottom: var(--sp-1);
  }

  /* A grid and not two flex rows: each word has to sit over the polarity it pays,
     or the column stops being the thing that ties them. */
  .bias {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: var(--sp-1) var(--sp-3);
  }

  .pair {
    display: inline-flex;
    align-items: center;
    gap: var(--badge-gap);
    white-space: nowrap;
  }

  /* The age's clock: ages and which phase, then how long a phase runs and how
     much of this one is left. `nowrap` because every part of it is a figure. */
  .clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--sp-1);
    text-align: right;
    white-space: nowrap;
  }

  /* One inline run, so the badges sit in the sentence rather than beside it. */
  .hover {
    display: inline;
  }

  .strip {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* No centring margin: the offsets already carry it, because half a dot is
     only half a device pixel half the time and the snap has to happen after the
     subtraction.

     The ring keeps its 1.5px, which is not a whole device pixel at 100% — and on
     a circle it does not have to be. A ring meets the grid only where its edges
     run straight, which is the four cardinal points and nowhere else; the rest
     of the circumference is antialiased at any weight. So the cost of the half
     pixel is the inner edge going soft at four points, and what it buys is a
     ring heavier than the hairline curve it rides without reading as a border.
     Exact at 200%, where 1.5 is three device pixels. */
  .marker {
    position: absolute;
    width: var(--marker);
    height: var(--marker);
    border-radius: 50%;
    background: var(--surface);
    box-shadow: inset 0 0 0 1.5px var(--ink-900);
  }

  /* Smaller and solid — it sits on the curve rather than riding it, and it is
     gone the moment the press comes up, so it has to read at a glance without
     competing with the playhead for the same reading. Under the badges' 9px as
     surely as the playhead is over it: a mark this size is a point, not a token.
     Odd, and deliberately: five pixels centred on a one-pixel line have a middle
     pixel to share. */
  .landing {
    position: absolute;
    width: var(--landing);
    height: var(--landing);
    border-radius: 50%;
    background: var(--ink-900);
  }

  .tooltip-host {
    display: none;
  }
</style>
