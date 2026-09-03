<script lang="ts">
  /**
   * The strike: a warped line from the cursor to the spot it is aimed at,
   * struck with the press and drawing in over its life rather than appearing
   * whole — the life the scene hands in as `life` is at least the click's own
   * duration, so the flight fills the wait instead of outliving or missing it.
   *
   * The far end is read live every frame rather than frozen at the strike: a
   * spot's world position is worked out through the body's own spin, which
   * turns under it while the bolt is in flight. The near end only does the
   * same while `isInstant` — a click with a wait of its own struck the cursor
   * where it stood, and a strike that then slides to wherever the cursor has
   * since wandered reads as unmoored from the press that threw it.
   *
   * Sits beside `Halo`, outside `PlanetBody` — the same reason: a strike is
   * about the world, not on it, and neither the hold nor the spin may reach it.
   */
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createBoltMaterial, syncBoltUniforms } from './material';
  import {
    BOLT_CAPACITY, fadeOf, growOf, holdOf, lifeOf, sparkWorldPosition, type Pulses, type PulseVisual,
  } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: PulseVisual;
    pulses: Pulses;
    /** Pixels per world unit — the one place the stroke's width needs it. */
    zoom: number;
    /**
     * Seconds from strike to landing — `visual.boltLife` lifted to the click's
     * own duration whenever that is longer, worked out by the scene since only
     * it knows the click. The authored value stands alone once there is no
     * building, or once one has ramped to instant.
     */
    life: number;
    /**
     * How much of the drawn length is lit behind the head — `visual.boltTrail`
     * scaled by the scene toward a full line the closer the life sits to its
     * own floor, so an instant click flashes whole rather than reading as a
     * comet. Falls back to the authored value when not given, which is what
     * lets a lab with no click of its own preview the slider directly.
     */
    trail?: number;
    /**
     * How much of the alpha holds at full weight through the life instead of
     * decaying the way `fadeOf` does — `1` for a real flight, easing to `0`
     * as the life nears its authored floor, where a hold reads as too bright
     * against a mark that used to fade across its whole life. Falls back to
     * `1` when not given, matching the lab's own always-hold preview.
     */
    hold?: number;
    /**
     * Whether the click that struck this bolt has no wait of its own — the
     * game's press always, or a lab with no building. Gates whether the near
     * end tracks `getCursor` at all; see the header doc for why a click with a
     * real duration keeps its strike planted where the press landed.
     */
    isInstant: boolean;
    /**
     * The cursor, in world xy — read fresh every frame a bolt is alive while
     * `isInstant`, so its strike-end follows the cursor rather than staying
     * where it struck. Ignored otherwise, and `undefined` falls back to the
     * mark's own frozen spawn point either way.
     */
    getCursor?: () => { x: number; y: number } | undefined;
    /**
     * How the world is held right now — `PlanetBody`'s own three angles plus
     * where the spin has got to. What `sparkWorldPosition` needs to place the
     * far end where its spot actually stands this frame rather than where it
     * was aimed.
     */
    lean: number;
    tilt: number;
    turn: number;
    spinAngle: number;
  }

  let {
    visual, pulses, zoom, life, trail, hold = 1, isInstant, getCursor, lean, tilt, turn, spinAngle,
  }: Props = $props();

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
    syncBoltUniforms(material, visual, trail);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    // One read for every live bolt this frame — they all strike from the same
    // cursor and read the same hold. Skipped outright unless `isInstant`, and
    // falls back to each mark's own frozen spawn point either way, so a
    // strike with nowhere live to read from still stands where it started.
    const live = isInstant ? getCursor?.() : undefined;
    const held = { lean, tilt, turn, spin: spinAngle };

    let drawn = 0;

    pulses.bolts.forEach((mark) => {
      const t = lifeOf(mark, pulses.now, life);
      if (t >= 1) return;

      const fx = live?.x ?? mark.fx;
      const fy = live?.y ?? mark.fy;
      const to = mark.to ? sparkWorldPosition(mark.to, held) : { x: 0, y: 0 };

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
      fades.setX(drawn, fadeOf(t) + hold * (holdOf(t) - fadeOf(t)));
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
