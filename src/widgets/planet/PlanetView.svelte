<script lang="ts">
  import { Canvas } from '@threlte/core';
  import PlanetScene from './PlanetScene.svelte';
  import type { AnchorVisual } from './anchor';
  import type { SwarmVisual } from './orbit';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** Rendered square, in px. Not a CSS scale — the outline must be drawn at this size. */
    px?: number;
    frame?: number;
    backgroundToken?: string;
    swarm?: SwarmVisual;
    cohorts?: number[];
    anchors?: AnchorVisual;
    anchored?: boolean[];
  }

  let {
    visual,
    px = 240,
    frame = 2.7,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    anchors,
    anchored,
  }: Props = $props();

  let host: HTMLDivElement | undefined = $state();
  let shown = $state(false);

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

<div class="planet-view" bind:this={host} style:width="{px}px" style:height="{px}px">
  {#if shown}
    <Canvas renderMode="on-demand">
      <PlanetScene {visual} {frame} {backgroundToken} {swarm} {cohorts} {anchors} {anchored} />
    </Canvas>
  {/if}
</div>

<style>
  .planet-view {
    flex: none;
    line-height: 0;
  }
</style>
