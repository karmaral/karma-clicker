<script lang="ts">
  /**
   * The wave, docked to the viewport rather than boxed in its own `Section`. Well
   * under `DensityWave`'s height. The status line answers for the phase you're in;
   * every other phase's kind, threshold and multiplier is one hover away instead
   * of a permanent legend.
   *
   * `H` is a fixed pixel height, not derived from the viewBox `W`: with
   * `preserveAspectRatio="none"` the two are independent, so the strip stays the
   * same height regardless of how many phases a planet has.
   */
  import { Tooltip, tooltip } from '$ui';
  import { f } from '$lib/utils';
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
  }

  let { phases, current, position, settleAt, draftAt }: Props = $props();

  const H = 40;
  const scaleY = H / WAVE_H;

  const W = $derived(phases.length * 100);
  const seg = $derived(W / phases.length);

  const path = $derived(buildWavePath(phases.length, W, 1));
  const markerY = $derived(markerYAt(phases.length, position, 1) * scaleY);

  /** Live, not authored — excess widens the pair, so the legend moves with it. */
  const MULTIPLIER = $derived.by(() => {
    const { biasWith, biasAgainst } = getWaveBias();

    return {
      light: `positive ×${f(biasWith, 2)}, negative ×${f(biasAgainst, 2)}`,
      dense: `negative ×${f(biasWith, 2)}, positive ×${f(biasAgainst, 2)}`,
    };
  });

  const currentPhase = $derived(phases[current]);

  let tooltipElems: (HTMLElement | undefined)[] = $state([]);
</script>

{#if currentPhase}
  <div class="status">
    <span>{currentPhase.kind === 'dense' ? 'Dense' : 'Light'} · {MULTIPLIER[currentPhase.kind]}</span>
    <span>phase {current + 1} of {phases.length}</span>
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

    {#each phases as _, i (i)}
      <rect
        x={i * seg} y="0" width={seg} height={H}
        fill="transparent"
        {@attach tooltip({ content: tooltipElems[i] })}
      />
    {/each}
  </svg>

  <span class="marker" style:left="{position * 100}%" style:top="{(markerY / H) * 100}%"></span>
</div>

{#each phases as phase, i (i)}
  <div class="tooltip-host" bind:this={tooltipElems[i]}>
    <Tooltip title={phase.kind === 'dense' ? 'Dense' : 'Light'}>
      {phase.at} · {MULTIPLIER[phase.kind]}
    </Tooltip>
  </div>
{/each}

<style>
  .status {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--ink-500);
    margin-bottom: var(--sp-1);
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

  .tooltip-host {
    display: none;
  }
</style>
