<script lang="ts">
  /**
   * The world's rings: a flat annulus in its equatorial plane, drawn as a tone
   * field with the body's shadow across it. Inside the hold and outside the
   * spin — the pattern reads the radius alone, so a turn would show nothing.
   */
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createRingMaterial, syncRingUniforms } from './material';
  import { RENDER_ORDER } from './stack';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
  }

  let { visual }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createRingMaterial();

  /** A unit annulus, 1 to 2 — the shader spans it, so the span is no rebuild. */
  const geometry = new THREE.RingGeometry(1, 2, 128, 1);

  $effect(() => {
    syncRingUniforms(material, visual);
    invalidate();
  });

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<!-- Laid into the equator. frustumCulled off: the shader has spanned it past
     the bounding sphere the unit annulus has. -->
<T.Mesh
  {geometry}
  {material}
  rotation.x={-Math.PI / 2}
  renderOrder={RENDER_ORDER.rings}
  frustumCulled={false}
/>
