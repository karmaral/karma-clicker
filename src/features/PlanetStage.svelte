<script lang="ts">
  import { DEFAULT_PULSE, DEFAULT_SWARM, DEFAULT_VISUAL, PlanetView } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';

  interface Props {
    id: string;
    /** Souls per cohort, in row order. Empty is a bare world, not a broken one. */
    cohorts?: number[];
    clickActionLabel?: string;
    sub?: string;
    onclickaction?: () => void;
  }

  let {
    id,
    cohorts = [],
    clickActionLabel = 'Incarnate',
    sub,
    onclickaction,
  }: Props = $props();

  const visual = $derived(planetVisuals[id] ?? DEFAULT_VISUAL);

  /**
   * Held at the swarm's framing whether or not there is one — a world that
   * shrank as the first cohort arrived would read as the planet moving away.
   */
  const SWARM_FRAME = 3.2;

  /** Full size; a narrower column shrinks the box on the same ratio. */
  const STAGE_WIDTH = 406;
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
      {clickActionLabel}
      {onclickaction}
    />
  {/if}

  <div class="caption">
    <span class="verb">{clickActionLabel}</span>
    {#if sub}
      <span class="sub num">{sub}</span>
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

  .sub {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
