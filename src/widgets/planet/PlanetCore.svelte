<script lang="ts">
  /**
   * What the body's window is a window onto: a solid at the middle of the world,
   * carrying the harvest's alignment as a ruling that leans one way on the
   * negative and the other on the positive, and is bare on even.
   *
   * A true sphere and not the body's geometry. The body's is a *lump* — the
   * terrain, baked — and a core cut from it would carry the world's mountains at
   * a third of their size, which says nothing and reads as a second planet. The
   * core is a reading, so its shape is the plainest one there is.
   *
   * Nothing here is game state, the separation the whole widget keeps: the world
   * says what a core looks like and the caller says which way it leans.
   */
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createCoreMaterial, syncCoreUniforms } from './material';
  import { RENDER_ORDER } from './stack';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** The harvest's alignment: −1, 0 or +1. 0 draws the ground tone alone. */
    lean: number;
    /**
     * How big, in body radii — the authored radius grown by the merge, worked
     * out one layer up where the split is known. The ruling does not come with
     * it: `coreHatchDensity` is strokes per *body* radius and the vertex reads
     * its offset in the same, so a core half drawn carries half the strokes at
     * the spacing every other world rules at, rather than the same picture
     * shrunk.
     */
    radius?: number;
  }

  let { visual, lean, radius }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createCoreMaterial();

  /**
   * A unit sphere, scaled to the authored radius by the mesh — so `core` is a
   * uniform write rather than a rebuild, and the fragment's view-space offset
   * comes out in body radii without a second uniform saying how big this is.
   *
   * Coarse next to the body's `detail`: it is never lit and never displaced, so
   * the only thing the tessellation buys is the roundness of its silhouette —
   * and the rim is feathered, so that silhouette is the one thing it is *all*
   * about.
   */
  const geometry = new THREE.SphereGeometry(1, 48, 32);

  $effect(() => {
    syncCoreUniforms(material, visual, lean);
    invalidate();
  });

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<T.Mesh
  {geometry}
  {material}
  scale={Math.max(0, radius ?? visual.core)}
  renderOrder={RENDER_ORDER.core}
/>
