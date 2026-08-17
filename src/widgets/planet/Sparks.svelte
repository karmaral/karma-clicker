<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import {
    createFlareMaterial, createFlareOutlineMaterial, createSparkMaterial,
    createSparkOutlineMaterial, syncFlareOutlineUniforms, syncFlareUniforms,
    syncSparkOutlineUniforms, syncSparkUniforms,
  } from './material';
  import { fadeOf, growOf, lifeOf, PULSE_CAPACITY, type Pulses, type PulseVisual } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: PulseVisual;
    /** The scene's marks and their clock, as the halo reads them. */
    pulses: Pulses;
    /**
     * The world's own size. A mark is the same mark on every planet, so a big
     * world wears small ones — this divides, it does not scale.
     */
    size?: number;
  }

  let { visual, pulses, size = 1 }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createSparkMaterial();
  const flareMaterial = createFlareMaterial();

  // The same two shapes grown, drawn behind the two above. Materials rather
  // than geometry: the outline is the mark's own outline, so it is written from
  // the same instance matrices and the same attributes as the mark.
  const outlineMaterial = createSparkOutlineMaterial();
  const flareOutlineMaterial = createFlareOutlineMaterial();

  /**
   * The dot and its ring, lying in the ground rather than facing the camera: a
   * quad in XZ, so the instance's turn from +Y to the surface normal is the
   * only thing that aims it.
   */
  const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  /**
   * The flare: two quads crossed about +Y, standing on the ground the dot lies
   * in. Authored 1 tall and 1 across so the instance's scale reads directly,
   * and untapered — the taper is a uniform, so a slider moves it without this
   * being rebuilt.
   */
  const flareGeometry = new THREE.BufferGeometry();

  flareGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0,
    0, 0, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0, 1, -0.5,
  ]), 3));
  flareGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
  ]), 2));
  flareGeometry.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);

  // One attribute object on both geometries: the two draws are the same marks
  // at the same ages, so a second copy could only ever disagree with this one.
  const fades = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);
  const grows = new THREE.InstancedBufferAttribute(new Float32Array(PULSE_CAPACITY), 1);

  geometry.setAttribute('fade', fades);
  geometry.setAttribute('grow', grows);
  flareGeometry.setAttribute('fade', fades);
  // The blade's taper travels on the ring's own curve, so it reads the same
  // number the ring does rather than a second one timed slightly differently.
  flareGeometry.setAttribute('grow', grows);

  let mesh: THREE.InstancedMesh | undefined = $state();
  let flare: THREE.InstancedMesh | undefined = $state();
  let outline: THREE.InstancedMesh | undefined = $state();
  let flareOutline: THREE.InstancedMesh | undefined = $state();

  const dummy = new THREE.Object3D();

  /** The blades are built along +Y; the turn from it is what lands them upright. */
  const UP = new THREE.Vector3(0, 1, 0);
  const facing = new THREE.Vector3();

  $effect(() => {
    syncSparkUniforms(material, visual);
    syncFlareUniforms(flareMaterial, visual);
    syncSparkOutlineUniforms(outlineMaterial, visual);
    syncFlareOutlineUniforms(flareOutlineMaterial, visual);
    invalidate();
  });

  useTask(() => {
    if (!mesh || !flare || !outline || !flareOutline) return;

    // Every flash is the same size, so these are read once rather than per
    // mark: the dot widened to hold its ring at full travel, as a diameter,
    // and the two heights the flare travels between, off the same dot.
    const dot = visual.sparkDot / Math.max(0.05, size);
    const span = dot * Math.max(1, visual.sparkRing) * 2;
    const riseFrom = dot * Math.max(0, visual.sparkRiseFrom);
    const riseTo = dot * Math.max(0, visual.sparkRiseTo);

    let drawn = 0;

    pulses.sparks.forEach((mark) => {
      const t = lifeOf(mark, pulses.now, visual.sparkLife);
      if (t >= 1) return;

      const grow = growOf(t);

      // The radius was sampled where the spark landed, so it sits on the
      // terrain rather than on the sphere the terrain was displaced from.
      dummy.position.set(mark.x * mark.r, mark.y * mark.r, mark.z * mark.r);
      dummy.quaternion.setFromUnitVectors(UP, facing.set(mark.x, mark.y, mark.z));

      dummy.scale.setScalar(span);
      dummy.updateMatrix();
      mesh.setMatrixAt(drawn, dummy.matrix);
      outline.setMatrixAt(drawn, dummy.matrix);

      // The blades are as wide as the dot and as tall as the rise has got to —
      // the one place the mark is not scaled uniformly. The height is here
      // rather than in the shader because it is a scale, and the taper is in
      // the shader because it is a shape.
      dummy.scale.set(dot * 2, riseFrom + (riseTo - riseFrom) * grow, dot * 2);
      dummy.updateMatrix();
      flare.setMatrixAt(drawn, dummy.matrix);
      flareOutline.setMatrixAt(drawn, dummy.matrix);

      fades.setX(drawn, fadeOf(t));
      grows.setX(drawn, grow);

      drawn++;
    });

    mesh.count = drawn;
    // Nowhere to rise to and nowhere to rise from is the flare off, and the
    // cheapest way to say so is to draw none of it rather than to draw a cross
    // of zero height.
    const risen = riseFrom > 0 || riseTo > 0;

    flare.count = risen ? drawn : 0;

    // An outline of nothing is not the fill at the plane behind — it is the
    // fill's antialiased rim poking out of it in the opposite ink. At 0 the
    // pass does not run at all.
    const inked = visual.sparkOutline > 0;

    outline.count = inked ? drawn : 0;
    flareOutline.count = inked && risen ? drawn : 0;

    mesh.instanceMatrix.needsUpdate = true;
    flare.instanceMatrix.needsUpdate = true;
    outline.instanceMatrix.needsUpdate = true;
    flareOutline.instanceMatrix.needsUpdate = true;
    fades.needsUpdate = true;
    grows.needsUpdate = true;
  });

  onDestroy(() => {
    geometry.dispose();
    flareGeometry.dispose();
    material.dispose();
    flareMaterial.dispose();
    outlineMaterial.dispose();
    flareOutlineMaterial.dispose();
  });
</script>

<T.InstancedMesh
  bind:ref={mesh}
  args={[geometry, material, PULSE_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.spark}
/>

<T.InstancedMesh
  bind:ref={flare}
  args={[flareGeometry, flareMaterial, PULSE_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.flare}
/>

<!--
  The same two geometries again. Behind the two above and drawn after them, so
  the depth test takes the ink off everything the mark itself covered and what
  is left is one border around all four shapes.
-->
<T.InstancedMesh
  bind:ref={outline}
  args={[geometry, outlineMaterial, PULSE_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.sparkOutline}
/>

<T.InstancedMesh
  bind:ref={flareOutline}
  args={[flareGeometry, flareOutlineMaterial, PULSE_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.flareOutline}
/>
