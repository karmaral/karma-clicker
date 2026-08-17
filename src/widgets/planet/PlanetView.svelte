<script lang="ts">
  import { Canvas } from '@threlte/core';
  import PlanetScene from './PlanetScene.svelte';
  import type { AnchorVisual } from './anchor';
  import type { HarnessVisual } from './harness';
  import type { SwarmVisual } from './orbit';
  import type { PulseVisual } from './pulse';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    widthPx?: number;
    heightPx?: number;
    frame?: number;
    backgroundToken?: string;
    swarm?: SwarmVisual;
    cohorts?: number[];
    anchors?: AnchorVisual;
    anchored?: boolean[];
    harness?: HarnessVisual;
    pulse?: PulseVisual;
    clickActionLabel?: string;
    onclickaction?: () => void;
  }

  let {
    visual,
    widthPx = 240,
    heightPx,
    frame = 2.7,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    anchors,
    anchored,
    harness,
    pulse,
    clickActionLabel = 'Incarnate',
    onclickaction,
  }: Props = $props();

  let host: HTMLDivElement | undefined = $state();
  let shown = $state(false);

  /**
   * The count the scene answers. Kept here rather than in the scene because the
   * canvas is unmounted whenever the view scrolls away, and a click is the
   * view's event — the scene is only where it is drawn.
   */
  let flashes = $state(0);

  /**
   * Each view is its own WebGL context and browsers cap those near sixteen —
   * past it the oldest are evicted and planets already drawn go blank. Mounting
   * only what is on screen is what makes a list of worlds affordable at all;
   * the div holds its px box either way, so nothing reflows on the swap.
   */
  $effect(() => {
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => { shown = entry.isIntersecting; },
      { rootMargin: '300px' },
    );

    observer.observe(host);

    return () => observer.disconnect();
  });
</script>

<div
  class="planet-view"
  bind:this={host}
  style:width="{widthPx}px"
  style:height="{heightPx ?? widthPx}px"
>
  {#if shown}
    <Canvas renderMode="on-demand">
      <PlanetScene
        {visual}
        {frame}
        {backgroundToken}
        {swarm}
        {cohorts}
        {anchors}
        {anchored}
        {harness}
        {pulse}
        {flashes}
      />
    </Canvas>
  {/if}

  <!-- A real button over the canvas rather than a handler on the div, and
       `onclick` rather than `onpointerdown`, so Enter and Space flash it too. -->
  {#if pulse}
    <button
      class="press"
      onclick={() => { flashes++; onclickaction?.(); }}
      aria-label={clickActionLabel}
    ></button>
  {/if}
</div>

<style>
  .planet-view {
    position: relative;
    flex: none;
    line-height: 0;
  }

  .press {
    position: absolute;
    inset: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }
</style>
