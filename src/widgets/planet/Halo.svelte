<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createHaloMaterial, syncHaloUniforms } from './material';
  import { fadeOf, growOf, lifeOf, PULSE_CAPACITY, type Pulses, type PulseVisual } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: PulseVisual;
    /**
     * The scene's marks and their clock. Read every frame and never through the
     * reactive graph — a flash is a frame's worth of geometry, not state.
     */
    pulses: Pulses;
  }

  let { visual, pulses }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createHaloMaterial();

  /** A unit quad. The shader draws the ring inside it; this never changes. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const fades = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);

  geometry.setAttribute('fade', fades);

  let mesh: THREE.InstancedMesh | undefined = $state();

  // Composes one matrix per live halo without allocating one.
  const dummy = new THREE.Object3D();

  $effect(() => {
    syncHaloUniforms(material, visual);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    const travel = visual.haloTo - visual.haloFrom;

    let drawn = 0;

    pulses.halos.forEach((mark) => {
      const t = lifeOf(mark, pulses.now, visual.haloLife);
      if (t >= 1) return;

      // The quad's inscribed circle is half its span, so the span is twice the
      // radius wanted — the one place that conversion is made.
      dummy.scale.setScalar((visual.haloFrom + travel * growOf(t)) * 2);
      dummy.updateMatrix();

      mesh.setMatrixAt(drawn, dummy.matrix);
      fades.setX(drawn, fadeOf(t));

      drawn++;
    });

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
    fades.needsUpdate = true;
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
  renderOrder={RENDER_ORDER.halo}
/>
