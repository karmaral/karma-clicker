<script lang="ts">
  /**
   * The strike: a warped line from the cursor to the spark it paid for,
   * drawing in over its life rather than appearing whole. Both ends are read
   * live every frame rather than frozen at the strike — the cursor moves, and
   * a spark is drawn inside the body's own spin and drifts with it, so a bolt
   * struck outside that spin has to chase both or the two visibly part ways
   * over a bolt's life. Sits beside `Halo`, outside `PlanetBody` — the same
   * reason: a strike is about the world, not on it, and neither the hold nor
   * the spin may reach it.
   */
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createBoltMaterial, syncBoltUniforms } from './material';
  import {
    BOLT_CAPACITY, fadeOf, growOf, lifeOf, sparkWorldPosition, type Pulses, type PulseVisual,
  } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: PulseVisual;
    pulses: Pulses;
    /** Pixels per world unit — the one place the stroke's width needs it. */
    zoom: number;
    /**
     * The cursor, in world xy — read fresh every frame a bolt is alive, so its
     * strike-end follows the cursor rather than staying where it struck.
     * `undefined` falls back to the mark's own frozen spawn point.
     */
    getCursor?: () => { x: number; y: number } | undefined;
    /**
     * How the world is held right now — `PlanetBody`'s own three angles plus
     * where the spin has got to. What `sparkWorldPosition` needs to place the
     * far end where its spark actually stands this frame rather than where it
     * landed.
     */
    lean: number;
    tilt: number;
    turn: number;
    spinAngle: number;
  }

  let { visual, pulses, zoom, getCursor, lean, tilt, turn, spinAngle }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createBoltMaterial();

  /** An axis-aligned unit quad, sized and placed per bolt on the CPU each frame. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const froms = new THREE.InstancedBufferAttribute(new Float32Array(BOLT_CAPACITY * 2), 2);
  const tos = new THREE.InstancedBufferAttribute(new Float32Array(BOLT_CAPACITY * 2), 2);
  const seeds = new THREE.InstancedBufferAttribute(new Float32Array(BOLT_CAPACITY), 1);
  const fades = new THREE.InstancedBufferAttribute(new Float32Array(BOLT_CAPACITY), 1);
  const reaches = new THREE.InstancedBufferAttribute(new Float32Array(BOLT_CAPACITY), 1);

  geometry.setAttribute('bFrom', froms);
  geometry.setAttribute('bTo', tos);
  geometry.setAttribute('bSeed', seeds);
  geometry.setAttribute('bFade', fades);
  geometry.setAttribute('bReach', reaches);

  let mesh: THREE.InstancedMesh | undefined = $state();

  // Composes one matrix per live bolt without allocating one.
  const dummy = new THREE.Object3D();

  $effect(() => {
    syncBoltUniforms(material, visual);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    // One read for every live bolt this frame — they all strike from the same
    // cursor and read the same hold. Falls back to each mark's own frozen
    // spawn point, so a strike with nowhere live to read from still stands
    // where it started.
    const live = getCursor?.();
    const held = { lean, tilt, turn, spin: spinAngle };

    let drawn = 0;

    pulses.bolts.forEach((mark) => {
      const t = lifeOf(mark, pulses.now, visual.boltLife);
      if (t >= 1) return;

      const fx = live?.x ?? mark.fx;
      const fy = live?.y ?? mark.fy;
      const to = mark.toSpark ? sparkWorldPosition(mark.toSpark, held) : { x: 0, y: 0 };

      const dx = to.x - fx;
      const dy = to.y - fy;
      const len = Math.hypot(dx, dy);

      // Room for the warp's own swing plus the stroke's width, in world units —
      // the fragment shader tests in world xy, so the quad only has to *cover*
      // the shape, not align to it. Axis-aligned, so the box is whatever is
      // wide enough to hold both, applied to each side equally. The width
      // includes the outline grown past it on each side.
      const strokeWorld = Math.max(0, visual.boltWidth) + Math.max(0, visual.boltOutline) * 2;
      const widthWorld = zoom > 0 ? strokeWorld / zoom : 0;
      const margin = Math.max(0, visual.boltWarp) * len + widthWorld + 0.02;

      dummy.position.set((fx + to.x) / 2, (fy + to.y) / 2, 0);
      dummy.scale.set(Math.abs(dx) + margin * 2, Math.abs(dy) + margin * 2, 1);
      dummy.updateMatrix();

      mesh.setMatrixAt(drawn, dummy.matrix);
      froms.setXY(drawn, fx, fy);
      tos.setXY(drawn, to.x, to.y);
      seeds.setX(drawn, mark.seed);
      fades.setX(drawn, fadeOf(t));
      reaches.setX(drawn, growOf(t));

      drawn++;
    });

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
    froms.needsUpdate = true;
    tos.needsUpdate = true;
    seeds.needsUpdate = true;
    fades.needsUpdate = true;
    reaches.needsUpdate = true;
  });

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<T.InstancedMesh
  bind:ref={mesh}
  args={[geometry, material, BOLT_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.bolt}
/>
