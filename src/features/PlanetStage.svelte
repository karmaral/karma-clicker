<script lang="ts">
  import { DEFAULT_PULSE, DEFAULT_SWARM, DEFAULT_VISUAL, PlanetView } from '$widgets/planet';
  import type { AnchorVisual, HarnessVisual } from '$widgets/planet';
  import { SweepBar } from '$ui';
  import { f } from '$lib/utils';
  import type { Listener } from '$lib/emission';
  import { spotlight } from '$lib/spotlight.svelte';
  import planetVisuals from '$data/planet-visuals';
  import { STAGE_WIDTH } from './planet-viewport';

  interface Props {
    id: string;
    /** Souls per cohort, in row order. Empty is a bare world, not a broken one. */
    cohorts?: number[];
    clickActionVerb?: string;
    clickActionSub?: string;
    /** The click's own duration — 0 once it has ramped to instant. */
    duration?: number;
    isInProgress?: boolean;
    subscribe?: (fn: Listener) => () => void;
    onclickaction?: () => void;
    /** A running count of landed yields. See `PlanetView`. */
    yields?: number;
    yieldValue?: number;
    /** The harness this world wears, and how much of it is down. See `PlanetScene`. */
    anchors?: AnchorVisual;
    anchored?: boolean[];
    harness?: HarnessVisual;
    /** How many souls the finished harness carries. See `SoulSwarm`. */
    riders?: number;
    /** What a press is worth while it is placing anchors. See `PlanetView`. */
    pressValue?: number;
    pressFormat?: (value: number) => string;
  }

  let {
    id,
    cohorts = [],
    clickActionVerb = 'Incarnate',
    clickActionSub,
    duration = 0,
    isInProgress = false,
    subscribe,
    onclickaction,
    yields = 0,
    yieldValue = 0,
    anchors,
    anchored,
    harness,
    riders,
    pressValue,
    pressFormat,
  }: Props = $props();

  const visual = $derived(planetVisuals[id] ?? DEFAULT_VISUAL);

  /**
   * Held at the swarm's framing whether or not there is one — a world that
   * shrank as the first cohort arrived would read as the planet moving away.
   */
  const SWARM_FRAME = 3.2;

  const STAGE_RATIO = 355 / 406;

  let width = $state(0);
  const widthPx = $derived(Math.round(Math.min(width, STAGE_WIDTH)));
  const heightPx = $derived(Math.round(widthPx * STAGE_RATIO));
</script>

<div class="stage" bind:clientWidth={width}>
  {#if widthPx > 0}
    <PlanetView
      {visual}
      {widthPx}
      {heightPx}
      frame={SWARM_FRAME}
      backgroundToken="--surface"
      swarm={DEFAULT_SWARM}
      {cohorts}
      pulse={DEFAULT_PULSE}
      clockKey={id}
      {clickActionVerb}
      disabled={isInProgress}
      {onclickaction}
      {yields}
      {yieldValue}
      {anchors}
      {anchored}
      {harness}
      {riders}
      {pressValue}
      {pressFormat}
    />
  {/if}

  <div class="caption">
    <span class={['verb', { lit: spotlight.isLit('building', 'main') }]}>{clickActionVerb}</span>
    {#if clickActionSub}
      <span class="sub num">{clickActionSub}</span>
    {/if}
    {#if duration && subscribe}
      <span class="cooldown">
        <SweepBar {subscribe} width="6rem" />
        {f(duration / 1000)}s
      </span>
    {/if}
  </div>
</div>

<style>
  .stage {
    position: relative;
    display: flex;
    justify-content: center;
  }

  /* Untouchable, so the press reaches the canvas under it. */
  .caption {
    position: absolute;
    bottom: 0;
    translate: 0% 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    pointer-events: none;
  }

  .verb {
    font-size: var(--fs-base);
    font-weight: 600;
  }

  /* The press has no row to tint, so the same surface-alt reading is drawn as
     a chip around the one word standing in for it. */
  .verb.lit {
    background-color: var(--surface-alt);
    margin-inline: -4px;
    padding-inline: 4px;
  }

  .cooldown {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--ink-500);
    margin-top: 2px;
  }

  .sub {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
