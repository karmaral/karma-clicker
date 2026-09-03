<script lang="ts">
  /**
   * The swarm's strikes, drawn. `SoulSwarm` decides *that* a soul struck and
   * where from — it is the only thing that knows where a soul actually is, on
   * its orbit or riding a line — and this turns the frame it filled into marks.
   *
   * The two are split because they are in different frames. The swarm is drawn
   * inside the body's hold, so its points carry the lean, the tilt and the turn;
   * a bolt is tested in *scene* xy by its own shader, so the points have to come
   * out of that hold first. `sparkWorldInto` is the chain, and the spin is left
   * at 0 on purpose: `PlanetBody` puts `children` — which is the swarm — inside
   * `Ry(turn)` and outside `Ry(spinAngle)`, so the world's turning surface must
   * not reach a soul standing off it.
   *
   * Sits beside `Bolt`, outside `PlanetBody`, and for a plainer reason than the
   * halo's: a mark that had the hold applied twice would be somewhere else.
   *
   * Singular like `Bolt`, and for the same reason: a component is named for the
   * mark it draws, where `SoulBolts` is the collection it reads them out of.
   */
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { createBoltMaterial, syncSoulBoltUniforms } from './material';
  import type { SwarmVisual } from './orbit';
  import { fadeOf, growOf, sparkWorldInto } from './pulse';
  import { SOUL_BOLT_CAPACITY, type SoulBolts } from './soul-bolt';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: SwarmVisual;
    /** The frame `SoulSwarm` filled, read and never written. */
    bolts: SoulBolts;
    /** Pixels per world unit — the one place the stroke's width needs it. */
    zoom: number;
    /**
     * How the world is held right now. `PlanetBody`'s first three angles only:
     * the swarm sits outside the spin, so there is no fourth to take.
     */
    lean: number;
    tilt: number;
    turn: number;
    /**
     * Where the body is *seen* to end, in body radii — the outline's bleed
     * included. What the far-side test measures against; see the loop.
     */
    rim: number;
  }

  let { visual, bolts, zoom, lean, tilt, turn, rim }: Props = $props();

  const { invalidate } = useThrelte();

  // The click's own material, built a second time rather than shared: the two
  // strikes are drawn in one frame at different weights, so one set of uniforms
  // could only ever be whichever of them wrote last.
  const material = createBoltMaterial();

  /** An axis-aligned unit quad, sized and placed per bolt on the CPU each frame. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  const froms = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_BOLT_CAPACITY * 2), 2);
  const tos = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_BOLT_CAPACITY * 2), 2);
  const seeds = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_BOLT_CAPACITY), 1);
  const fades = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_BOLT_CAPACITY), 1);
  const reaches = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_BOLT_CAPACITY), 1);

  geometry.setAttribute('bFrom', froms);
  geometry.setAttribute('bTo', tos);
  geometry.setAttribute('bSeed', seeds);
  geometry.setAttribute('bFade', fades);
  geometry.setAttribute('bReach', reaches);

  let mesh: THREE.InstancedMesh | undefined = $state();

  // Composes one matrix per live bolt without allocating one, and the two ends
  // of it likewise — a frame can hold sixty of these.
  const dummy = new THREE.Object3D();
  const near = { x: 0, y: 0, z: 0 };
  const far = { x: 0, y: 0, z: 0 };
  const spot = { x: 0, y: 0, z: 0, r: 1 };

  $effect(() => {
    syncSoulBoltUniforms(material, visual);
    invalidate();
  });

  useTask(() => {
    if (!mesh) return;

    // One hold for every mark this frame — they are all on the same world. The
    // spin is not taken; see the header.
    const held = { lean, tilt, turn, spin: 0 };

    // The same room the click's strike reserves: the warp's own swing plus the
    // stroke and its outline, in world units, since the fragment shader tests in
    // world xy and the quad only has to *cover* the shape.
    const strokeWorld = Math.max(0, visual.boltWidth) + Math.max(0, visual.boltOutline) * 2;
    const widthWorld = zoom > 0 ? strokeWorld / zoom : 0;

    let drawn = 0;

    for (let i = 0; i < bolts.count; i++) {
      const mark = bolts.marks[i];

      spot.x = mark.fx; spot.y = mark.fy; spot.z = mark.fz;
      sparkWorldInto(spot, held, near);

      // The one thing the bolt material cannot do for itself. It draws with no
      // depth test at all — deliberately, since the click's strike is *about*
      // the world rather than on it — so a soul on the far side would throw its
      // mark straight through the planet at the reader. Behind and inside the
      // silhouette is the whole of "hidden", and it is the same rule the soul's
      // own shader already draws that dot by.
      if (near.z < 0 && Math.hypot(near.x, near.y) < rim) continue;

      spot.x = mark.tx; spot.y = mark.ty; spot.z = mark.tz;
      sparkWorldInto(spot, held, far);

      const dx = far.x - near.x;
      const dy = far.y - near.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;

      // Turned to lie along the strike, and cut off where the strike has got
      // to — where the click's bolt takes the axis-aligned box around the whole
      // span. Both are worth doing here for the same reason the click can
      // ignore: a soul's strike is aimed at the world's middle, so its span is
      // long, and there are hundreds of them rather than eight.
      //
      // The box around a long diagonal is nearly all corner, and the shader
      // throws away every fragment past `vReach` anyway, so the far end of it
      // is paid for twice over and drawn never. Neither of these approximates
      // anything: the shader tests in world xy off `vFrom`/`vTo` and never
      // reads the quad, so the quad owes it coverage and nothing else.
      const reach = growOf(mark.t);

      // Across: the warp's own swing off the line — `uWarp * len * 4 * t(1-t)`
      // peaks at `uWarp * len` — plus the stroke and its outline.
      const across = Math.max(0, visual.boltWarp) * len + widthWorld + 0.02;
      const along = len * reach + widthWorld + 0.04;

      dummy.position.set(
        near.x + (dx / len) * (along / 2),
        near.y + (dy / len) * (along / 2),
        0,
      );
      dummy.rotation.set(0, 0, Math.atan2(dy, dx));
      dummy.scale.set(along, across * 2, 1);
      dummy.updateMatrix();

      mesh.setMatrixAt(drawn, dummy.matrix);
      froms.setXY(drawn, near.x, near.y);
      tos.setXY(drawn, far.x, far.y);
      seeds.setX(drawn, mark.seed);
      // The click's two curves, and no `hold` beside them: a soul's strike is
      // short by authoring and never has a click's duration stretched over it,
      // so there is nothing here for a hold to rescue from fading out early.
      fades.setX(drawn, fadeOf(mark.t));
      // The same figure the quad was cut to, and it has to stay the same one —
      // a quad shorter than the reach crops the strike's head off.
      reaches.setX(drawn, reach);

      drawn++;
    }

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
  args={[geometry, material, SOUL_BOLT_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.bolt}
/>
