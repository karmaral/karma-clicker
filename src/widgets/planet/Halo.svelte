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

  /**
   * The two draws a flash makes against its echo: where the warp starts, and
   * how the lobe count came out. Written every frame from the mark rather than
   * once at the flash, because a slot is recycled and the attribute is not.
   */
  const turns = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);
  const scatters = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);

  geometry.setAttribute('fade', fades);
  geometry.setAttribute('turn', turns);
  geometry.setAttribute('scatter', scatters);

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

      // The instance carries the ring's *radius*. Turning that into a quad is
      // the shader's, because how far past the ring the quad has to reach is
      // the echo's warp — which only the shader knows where to divide back out.
      dummy.scale.setScalar(visual.haloFrom + travel * growOf(t));
      dummy.updateMatrix();

      mesh.setMatrixAt(drawn, dummy.matrix);
      fades.setX(drawn, fadeOf(t));
      turns.setX(drawn, mark.turn);
      scatters.setX(drawn, mark.scatter);

      drawn++;
    });

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
    fades.needsUpdate = true;
    turns.needsUpdate = true;
    scatters.needsUpdate = true;
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
