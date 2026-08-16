<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { sampleLoop, type HarnessLoop } from './harness';
  import { createSoulMaterial, syncSoulUniforms } from './material';
  import {
    createSouls, phaseOf, placeSoul, riderCount, SOUL_CAPACITY, type SwarmVisual,
  } from './orbit';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: SwarmVisual;
    /** Souls per cohort, in cohort order. One dot is one soul while that holds. */
    counts: number[];
    /** Pixels per world unit. Only the dots' px floor needs it. */
    zoom: number;
    /** The lines to ride, if there are any. `visual.riders` says how many do. */
    loops?: HarnessLoop[];
    /**
     * How far the body has turned. The swarm sits outside the spin and the
     * harness inside it, so a soul reading a loop has to put it back where the
     * world has since carried it.
     */
    spinAngle?: number;
  }

  let { visual, counts, zoom, loops, spinAngle = 0 }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createSoulMaterial();

  /** A unit quad. The shader sizes and billboards it; this never changes. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const souls = $derived(createSouls(visual, counts));

  let mesh: THREE.InstancedMesh | undefined = $state();
  let elapsed = 0;

  // Composes one matrix per soul without allocating one.
  const dummy = new THREE.Object3D();

  const AXIS = new THREE.Vector3(0, 1, 0);

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

    // A soul either rides or it does not: riders are bought a whole soul at a
    // time, and a soul part of the way onto its line would travel the chord
    // between two points on a sphere, which cuts through the world.
    const lines = loops ?? [];
    const riders = lines.length ? riderCount(visual, souls.length) : 0;

    // Souls are spread across the whole harness rather than taking loops in
    // order: at eight anchors there are far more loops than souls, and modulo
    // would crowd every one of them onto the first few pairs. The line is fixed
    // by the soul's own index and not by how many ride, so buying a rider adds
    // a soul to a line instead of dealing the swarm again.
    const stride = lines.length / Math.max(1, souls.length);

    souls.forEach((soul, i) => {
      if (soul.place < riders) {
        const line = lines[Math.floor(i * stride) % lines.length];

        sampleLoop(line, phaseOf(soul, elapsed), dummy.position);
        dummy.position.applyAxisAngle(AXIS, spinAngle);
      } else {
        placeSoul(soul, elapsed, dummy.position);
      }

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
  renderOrder={RENDER_ORDER.soul}
/>
