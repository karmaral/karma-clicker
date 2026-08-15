<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createSoulMaterial, syncSoulUniforms } from './material';
  import { createSouls, placeSoul, SOUL_CAPACITY, type SwarmVisual } from './orbit';

  interface Props {
    visual: SwarmVisual;
    /** Souls per cohort, in cohort order. One dot is one soul while that holds. */
    counts: number[];
    /** Pixels per world unit. Only the dots' px floor needs it. */
    zoom: number;
  }

  let { visual, counts, zoom }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createSoulMaterial();

  /** A unit quad. The shader sizes and billboards it; this never changes. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const souls = $derived(createSouls(visual, counts));

  let mesh: THREE.InstancedMesh | undefined = $state();
  let elapsed = 0;

  // Composes one matrix per soul without allocating one.
  const dummy = new THREE.Object3D();

  $effect(() => {
    syncSoulUniforms(material, visual);
    invalidate();
  });

  useTask((delta) => {
    if (!mesh) return;

    elapsed += delta;

    // Souls are sized in body radii, so zoom carries them — a push-in grows the
    // swarm with the world. The floor is the one thing left in px, and it only
    // bites at widget sizes where the alternative is invisible dust.
    const floor = zoom > 0 ? visual.dotFloor / zoom : 0;

    souls.forEach((soul, i) => {
      placeSoul(soul, elapsed, dummy.position);
      dummy.scale.setScalar(Math.max(soul.size, floor));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.count = souls.length;
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  });

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<T.InstancedMesh
  bind:ref={mesh}
  args={[geometry, material, SOUL_CAPACITY]}
  frustumCulled={false}
  renderOrder={2}
/>
