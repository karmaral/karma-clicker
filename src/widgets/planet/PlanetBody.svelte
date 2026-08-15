<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy, type Snippet } from 'svelte';
  import * as THREE from 'three';
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
     * Drawn inside the body's tilt but outside its spin — orbits and markers
     * share the world's axis without being dragged round by its surface.
     */
    children?: Snippet;
  }

  let { visual, zoom, children }: Props = $props();

  const { invalidate } = useThrelte();
  const ramp = readInkRamp();
  const surface = createSurfaceMaterial();
  const outline = createOutlineMaterial();

  let spinner: THREE.Group | undefined = $state();

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

  useTask((delta) => {
    if (!spinner || !visual.spin) return;

    spinner.rotation.y += visual.spin * delta;
    invalidate();
  });

  onDestroy(() => {
    surface.dispose();
    outline.dispose();
  });
</script>

<T.Group rotation.x={visual.tilt}>
  <T.Group bind:ref={spinner}>
    {#if visual.outline > 0}
      <T.Mesh {geometry} material={outline} />
    {/if}
    <T.Mesh {geometry} material={surface} />
  </T.Group>

  {@render children?.()}
</T.Group>
