<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createSparkMaterial, syncSparkUniforms } from './material';
  import { fadeOf, growOf, lifeOf, PULSE_CAPACITY, type Pulses, type PulseVisual } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: PulseVisual;
    /** The scene's marks and their clock, as the halo reads them. */
    pulses: Pulses;
  }

  let { visual, pulses }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createSparkMaterial();

  const geometry = new THREE.PlaneGeometry(1, 1);

  const fades = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);
  const grows = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);

  geometry.setAttribute('fade', fades);
  geometry.setAttribute('grow', grows);

  let mesh: THREE.InstancedMesh | undefined = $state();

  const dummy = new THREE.Object3D();

  $effect(() => {
    syncSparkUniforms(material, visual);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    // Every flash is the same size, so the span is read once rather than per
    // mark: the dot, widened to hold its ring at full travel, as a diameter.
    const span = visual.sparkDot * Math.max(1, visual.sparkRing) * 2;

    let drawn = 0;

    pulses.sparks.forEach((mark) => {
      const t = lifeOf(mark, pulses.now, visual.sparkLife);
      if (t >= 1) return;

      // The radius was sampled where the spark landed, so it sits on the
      // terrain rather than on the sphere the terrain was displaced from.
      dummy.position.set(mark.x * mark.r, mark.y * mark.r, mark.z * mark.r);
      dummy.scale.setScalar(span);
      dummy.updateMatrix();

      mesh.setMatrixAt(drawn, dummy.matrix);
      fades.setX(drawn, fadeOf(t));
      grows.setX(drawn, growOf(t));

      drawn++;
    });

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
    fades.needsUpdate = true;
    grows.needsUpdate = true;
  });

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<T.InstancedMesh
  bind:ref={mesh}
  args={[geometry, material, PULSE_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.spark}
/>
