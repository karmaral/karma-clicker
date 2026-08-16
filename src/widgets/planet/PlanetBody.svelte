<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy, type Snippet } from 'svelte';
  import { buildGeometry, trimGeometryCache } from './geometry';
  import { readInkRamp } from './ink';
  import {
    createOutlineMaterial, createSurfaceMaterial,
    syncOutlineUniforms, syncSurfaceUniforms,
  } from './material';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** Pixels per world unit. The outline is authored in px, so it needs this. */
    zoom: number;
    /**
     * How far the world has turned. Kept by the scene rather than here: the
     * swarm reads it too, and a body that integrated its own angle would be a
     * second clock for the same rotation.
     */
    spinAngle?: number;
    /**
     * Drawn inside the body's tilt but outside its spin — orbits and markers
     * share the world's axis without being dragged round by its surface.
     */
    children?: Snippet;
    /**
     * Inside the spin, for anything that is *on* the surface rather than around
     * it. The same slot the terrain occupies, so it turns with the ground.
     */
    standing?: Snippet;
  }

  let { visual, zoom, spinAngle = 0, children, standing }: Props = $props();

  const { invalidate } = useThrelte();
  const ramp = readInkRamp();
  const surface = createSurfaceMaterial();
  const outline = createOutlineMaterial();

  /** Reads only the shape fields, so band sliders never rebuild the mesh. */
  const geometry = $derived.by(() => {
    const built = buildGeometry(visual);
    trimGeometryCache();

    return built;
  });

  $effect(() => {
    geometry;
    syncSurfaceUniforms(surface, visual);
    syncOutlineUniforms(outline, visual, ramp, zoom);
    invalidate();
  });

  onDestroy(() => {
    surface.dispose();
    outline.dispose();
  });
</script>

<T.Group rotation.x={visual.tilt}>
  <T.Group rotation.y={spinAngle}>
    {#if visual.outline > 0}
      <T.Mesh {geometry} material={outline} />
    {/if}
    <T.Mesh {geometry} material={surface} />

    {@render standing?.()}
  </T.Group>

  {@render children?.()}
</T.Group>
