<script lang="ts">
  /**
   * The wave, docked to the viewport rather than boxed in its own `Section`. Well
   * under `DensityWave`'s height. The head above it is the world's whole clock —
   * what each half of the wobble pays, where in the age you are, and how long a
   * phase runs. Every *other* phase's closing time is still one hover away.
   *
   * `H` is a fixed pixel height, not derived from the viewBox `W`: with
   * `preserveAspectRatio="none"` the two are independent, so the strip stays the
   * same height regardless of how many phases a planet has.
   */
  import { Badge, Label, Tooltip, tooltip } from '$ui';
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
    /** The wave is a clock: every phase is the same length. Ms. */
    phaseMs: number;
    /** And how much of the one you are in is left. Ms. */
    remainingMs: number;
    /** Ages completed on this world — the gate's own count. */
    agesLived: number;
  }

  let {
    phases, current, position, settleAt, draftAt, yieldAt, phaseMs, remainingMs, agesLived,
  }: Props = $props();

  const H = 40;
  const scaleY = H / WAVE_H;

  const W = $derived(phases.length * 100);
  const seg = $derived(W / phases.length);

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

<div class="strip" style:height="{H}px">
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
    {#each phases as _, i (i)}
      {#if i % 2 === 1 || i === current}
        <rect
          x={i * seg} y="0" width={seg} height={H}
          fill="var(--ink-900)"
          opacity={i === current ? 0.05 : 0.025}
        />
      {/if}
      {#if i > 0}
        <line x1={i * seg} y1="0" x2={i * seg} y2={H} stroke="var(--line-100)" stroke-width="1" />
      {/if}
    {/each}

    <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--line-100)" stroke-width="1" />
    <path
      d={path} fill="none" stroke="var(--ink-900)" stroke-width="1"
      transform="scale(1 {scaleY})" vector-effect="non-scaling-stroke"
    />
    <line
      x1={position * W} y1="0" x2={position * W} y2={H}
      stroke="var(--ink-300)" stroke-width="1" stroke-dasharray="2 3"
      vector-effect="non-scaling-stroke"
    />

    <!-- Both solid: the playhead owns the dash, and a second dashed line would
         read as another now rather than as a deadline. Weight says which is
         which — the committed one takes the ink. -->
    {#if draftAt !== undefined}
      <line
        x1={draftAt * W} y1="0" x2={draftAt * W} y2={H}
        stroke="var(--ink-300)" stroke-width="1" vector-effect="non-scaling-stroke"
      />
    {/if}

    {#if settleAt !== undefined}
      <line
        x1={settleAt * W} y1="0" x2={settleAt * W} y2={H}
        stroke="var(--ink-900)" stroke-width="1" vector-effect="non-scaling-stroke"
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

         The dot that caps it is HTML, beside the playhead's — a circle in here
         would be an ellipse, since `preserveAspectRatio="none"` scales the two
         axes apart. It carries the weight, so the line can stay a leader. -->
    {#if yieldY !== undefined}
      <line
        x1={yieldAt! * W} y1={yieldY} x2={yieldAt! * W} y2={H}
        stroke="var(--ink-300)" stroke-width="1" vector-effect="non-scaling-stroke"
      />
    {/if}

    {#each phases as _, i (i)}
      <rect
        x={i * seg} y="0" width={seg} height={H}
        fill="transparent"
        {@attach tooltip({ content: tooltipElems[i] })}
      />
    {/each}
  </svg>

  <span class="marker" style:left="{position * 100}%" style:top="{(markerY / H) * 100}%"></span>

  <!-- Filled where the playhead is hollow: now is a place you are standing in,
       the landing is a point on the curve. -->
  {#if yieldY !== undefined}
    <span class="landing" style:left="{yieldAt! * 100}%" style:top="{(yieldY / H) * 100}%"></span>
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
  .head {
    display: flex;
    align-items: flex-start;
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

  /* The world's own clock: where in the age, then how long a phase runs and how
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

  .marker {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: inset 0 0 0 1.5px var(--ink-900);
  }

  /* Smaller and solid — it sits on the curve rather than riding it, and it is
     gone the moment the press comes up, so it has to read at a glance without
     competing with the playhead for the same reading. */
  .landing {
    position: absolute;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: var(--ink-900);
  }

  .tooltip-host {
    display: none;
  }
</style>
