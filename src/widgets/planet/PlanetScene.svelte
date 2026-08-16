<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { fromStore } from 'svelte/store';
  import * as THREE from 'three';
  import Anchors from './Anchors.svelte';
  import PlanetBody from './PlanetBody.svelte';
  import SoulSwarm from './SoulSwarm.svelte';
  import type { AnchorVisual } from './anchor';
  import { createSurfaceField } from './field';
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
    anchors?: AnchorVisual;
    /** One flag per anchor. Empty draws no harness, the way `cohorts` does. */
    anchored?: boolean[];
  }

  let {
    visual,
    frame = 2.7,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    anchors,
    anchored,
  }: Props = $props();

  const { size: sizeStore, scene, invalidate } = useThrelte();
  const size = fromStore(sizeStore);

  /**
   * Threlte sizes an orthographic frustum in pixels, so `zoom` is exactly
   * pixels per world unit — which is what makes a px-authored outline hold its
   * weight at any widget size.
   */
  const zoom = $derived(Math.min(size.current.width, size.current.height) / frame);

  const hasAnchors = $derived(Boolean(anchors && anchored?.length));

  /**
   * A second read of the same field the mesh was built from — same seed, same
   * settings, same answer. Built here rather than lifted out of `geometry.ts`
   * because only a world with anchors pays for it, and the cost is the range
   * measure alone.
   */
  const field = $derived(hasAnchors ? createSurfaceField(visual) : undefined);

  $effect(() => {
    scene.background = new THREE.Color(readToken(backgroundToken, '#f4f4f2'));
    invalidate();
  });
</script>

<T.OrthographicCamera makeDefault position={[0, 0, 5]} {zoom} />

<PlanetBody {visual} {zoom}>
  {#snippet standing()}
    {#if anchors && anchored?.length && field}
      <Anchors visual={anchors} {anchored} {field} {zoom} />
    {/if}
  {/snippet}

  {#if swarm && cohorts?.length}
    <SoulSwarm visual={swarm} counts={cohorts} {zoom} />
  {/if}
</PlanetBody>
