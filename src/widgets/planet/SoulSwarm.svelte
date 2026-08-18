<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import type { WorldClock } from './clock';
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
     * The world's clock, advanced by the scene and only read here. Not `$state`
     * and not a number: the drift is a frame's worth of geometry, and putting a
     * value that moves every frame through the reactive graph is the rule
     * `Sparks` and `Halo` already draw by.
     */
    clock: WorldClock;
    /**
     * How far the body has turned. The swarm sits outside the spin and the
     * harness inside it, so a soul reading a loop has to put it back where the
     * world has since carried it.
     */
    spinAngle?: number;
    /**
     * The world's own size. A soul is the same soul on every planet, so a big
     * world wears fine ones — this divides the dots, and leaves the orbits and
     * the px floor alone.
     */
    size?: number;
    /**
     * How far the body's outline bleeds past its surface, in body radii. Added
     * to the authored `rim` rather than replacing it: `rim` says where the ink
     * switches on the *world*, and this says how much of the world the widget
     * draws past that. A soul crossing behind used to come back out inside the
     * outline, which is the harness's seam and the same fix.
     */
    bleed?: number;
  }

  let {
    visual, counts, zoom, loops, clock, spinAngle = 0, size = 1, bleed = 0,
  }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createSoulMaterial();

  /** A unit quad. The shader sizes and billboards it; this never changes. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const souls = $derived(createSouls(visual, counts));

  let mesh: THREE.InstancedMesh | undefined = $state();

  // Composes one matrix per soul without allocating one.
  const dummy = new THREE.Object3D();

  const AXIS = new THREE.Vector3(0, 1, 0);

  $effect(() => {
    syncSoulUniforms(material, visual, bleed);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    // Read, never advanced: the scene keeps the world's time, and a swarm that
    // integrated its own would drift away from the body it orbits.
    const elapsed = clock.elapsed;

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

        // A rider covers its whole loop in one turn of the orbit it left, and a
        // loop is shorter than that orbit — a crown petal by several times — so
        // reading it at the soul's own phase costs it most of its speed. The
        // rate is scaled by the ratio of the two paths, which keeps what the
        // eye actually measures, distance per second, the same on a line as off
        // one. It is the phase that is rescaled and not the clock, so the soul
        // stays on its own loop rather than sharing a lane with its neighbours.
        const around = Math.PI * 2 * soul.radius;
        const rate = line.length > 1e-6 ? around / line.length : 1;

        sampleLoop(line, phaseOf(soul, elapsed * rate), dummy.position);
        dummy.position.applyAxisAngle(AXIS, spinAngle);
      } else {
        placeSoul(soul, elapsed, dummy.position);
      }

      // The floor is in px and stays there: a small widget wants dots and not
      // dust whatever size the world it is holding claims to be.
      dummy.scale.setScalar(Math.max(soul.size / Math.max(0.05, size), floor));
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
