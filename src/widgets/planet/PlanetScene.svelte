<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { fromStore } from 'svelte/store';
  import * as THREE from 'three';
  import PlanetBody from './PlanetBody.svelte';
  import SoulSwarm from './SoulSwarm.svelte';
  import { readToken } from './ink';
  import type { SwarmVisual } from './orbit';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** World units across the viewport's short axis — the framing, not the planet. */
    frame?: number;
    backgroundToken?: string;
    swarm?: SwarmVisual;
    /**
     * Souls per cohort. Absent or empty draws no swarm at all, so every existing
     * caller is unchanged — and a world with no cohorts is bare, not broken.
     */
    cohorts?: number[];
  }

  let {
    visual,
    frame = 2.7,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
  }: Props = $props();

  const { size: sizeStore, scene, invalidate } = useThrelte();
  const size = fromStore(sizeStore);

  /**
   * Threlte sizes an orthographic frustum in pixels, so `zoom` is exactly
   * pixels per world unit — which is what makes a px-authored outline hold its
   * weight at any widget size.
   */
  const zoom = $derived(Math.min(size.current.width, size.current.height) / frame);

  $effect(() => {
    scene.background = new THREE.Color(readToken(backgroundToken, '#f4f4f2'));
    invalidate();
  });
</script>

<T.OrthographicCamera makeDefault position={[0, 0, 5]} {zoom} />

<PlanetBody {visual} {zoom}>
  {#if swarm && cohorts?.length}
    <SoulSwarm visual={swarm} counts={cohorts} {zoom} />
  {/if}
</PlanetBody>
