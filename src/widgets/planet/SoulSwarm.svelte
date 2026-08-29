<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy, untrack } from 'svelte';
  import * as THREE from 'three';
  import type { WorldClock } from './clock';
  import { sampleLoop, type HarnessLoop } from './harness';
  import { createSoulMaterial, createSpawnMaterial, syncSoulUniforms, syncSpawnUniforms } from './material';
  import {
    berthOf, berthRoom, createSouls, createSpawns, hatchOf, phaseOf, placeSoul, rankOf, ridersOf,
    settleScale, swellOf, travelOf, SOUL_CAPACITY, SPAWN_CAPACITY, type SwarmVisual,
  } from './orbit';
  import { lifeOf } from './pulse';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: SwarmVisual;
    /** Souls per cohort, in cohort order. One dot is one soul while that holds. */
    counts: number[];
    /** Pixels per world unit. Only the dots' px floor needs it. */
    zoom: number;
    /** The lines to ride, if there are any. Empty and nothing rides, whatever is bought. */
    loops?: HarnessLoop[];
    /**
     * How many souls the harness carries. Game state, so it is a prop and not a
     * `SwarmVisual` field — the same separation `counts` and `merge` keep.
     * Absent falls back to the visual's authored share, which is the lab.
     */
    riders?: number;
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
    /**
     * The share of the swarm staying with the world, 0…1. Game state, so it is
     * a prop and not a `SwarmVisual` field — the same separation `counts` keeps.
     * Absent is a swarm with nothing to split, and no soul leaves its orbit.
     *
     * Followed rather than obeyed — see `shown`. This is where the split *is*;
     * what the swarm draws is a beat or so behind it, on purpose.
     */
    merge?: number;
    /**
     * The core's radius, in body radii — the body's own figure, so it is a prop
     * for the reason `bleed` is. 0 is a world with no core, and then a soul
     * staying settles to `settleAt` and stops there, which is every caller that
     * predates this.
     *
     */
    core?: number;
    /**
     * And how much of that radius is actually drawn — the same figure the body
     * scales its core sphere by. It is what a soul is *inside*, so the ink and
     * the occlusion cut here, while the berths and their spacing stay on the
     * full `core`: a berth that moved as the core grew would be one every
     * crossing soul was chasing. Absent is the core drawn whole.
     */
    filled?: number;
    /**
     * The harvest's alignment, −1, 0 or +1. The swarm needs it for one thing:
     * the core's ground is paper on one reading and black on the other, so the
     * ink an arrived soul takes has to know which. That ink is fixed rather than
     * authored, and it is not the hatch's — see `syncSoulUniforms`.
     */
    lean?: number;
  }

  let {
    visual, counts, zoom, loops, riders, clock, spinAngle = 0, size = 1, bleed = 0, merge,
    core = 0, filled, lean = 0,
  }: Props = $props();

  /** The core as drawn, which is the only one an arrival is measured against. */
  const drawn = $derived(Math.max(0, Math.min(core, filled ?? core)));

  const { invalidate } = useThrelte();
  const material = createSoulMaterial();

  /** A unit quad. The shader sizes and billboards it; this never changes. */
  const geometry = new THREE.PlaneGeometry(1, 1);

  /**
   * How far each soul has committed to the world. The shader hides a soul
   * behind the body in proportion to it, so a soul that is leaving is never
   * behind anything and is never cut by the silhouette. Seeded at 1, which is
   * every caller that passes no `merge` — the swarm the shader was written for.
   */
  const stays = new THREE.InstancedBufferAttribute(new Float32Array(SOUL_CAPACITY).fill(1), 1);

  geometry.setAttribute('stay', stays);

  const souls = $derived(createSouls(visual, counts));

  /**
   * The spawn-in flare: a small second mesh, keyed to the *index* a soul lit
   * at rather than to the soul — see `createSpawns`. Rides the exact matrix
   * the main loop computes for that index, copied the same frame, so it never
   * has to know whether the soul it marks is orbiting, crossing or berthed.
   */
  const spawnMaterial = createSpawnMaterial();
  const spawnGeometry = new THREE.PlaneGeometry(1, 1);
  const spawnSizes = new THREE.InstancedBufferAttribute(new Float32Array(SPAWN_CAPACITY), 1);
  const spawnSpins = new THREE.InstancedBufferAttribute(new Float32Array(SPAWN_CAPACITY), 1);
  /** The soul's own `stay`, copied alongside its matrix — see the fill loop. */
  const spawnStays = new THREE.InstancedBufferAttribute(new Float32Array(SPAWN_CAPACITY), 1);

  spawnGeometry.setAttribute('sSize', spawnSizes);
  spawnGeometry.setAttribute('sSpin', spawnSpins);
  spawnGeometry.setAttribute('sStay', spawnStays);

  const spawns = createSpawns();

  /**
   * How far each soul has hatched, 0…1 — the flare's own clock read a second
   * time, filled from the live marks at the top of a frame and spent on the
   * dots' scale as they are placed. 1 is a soul with no mark on it, which is
   * every soul that has been here longer than one `spawnLife`.
   *
   * A plain array and not a rune, for the reason `shown` is one: it is written
   * inside the frame loop, and nothing outside it reads it.
   */
  const hatches = new Float32Array(SOUL_CAPACITY).fill(1);

  /** What `counts` last held, so a rise is read off the delta and not the total. */
  let previousCounts: number[] = [];

  $effect(() => {
    const next = counts;
    const now = untrack(() => clock.elapsed);

    let prefix = 0;

    for (let i = 0; i < next.length; i++) {
      const was = previousCounts[i] ?? 0;
      const have = Math.max(0, Math.floor(next[i]));
      const added = have - was;

      for (let k = 0; k < added; k++) {
        const index = prefix + was + k;
        if (index < SOUL_CAPACITY) spawns.spawn(index, now);
      }

      prefix += have;
    }

    previousCounts = next.slice();
    invalidate();
  });

  let mesh: THREE.InstancedMesh | undefined = $state();
  let spawnMesh: THREE.InstancedMesh | undefined = $state();

  // Composes one matrix per soul without allocating one.
  const dummy = new THREE.Object3D();

  /** The berth a soul is crossing to, reused for the same reason `dummy` is. */
  const berth = new THREE.Vector3();

  const AXIS = new THREE.Vector3(0, 1, 0);

  /**
   * The split the swarm is *showing*, which chases the split the game is
   * holding rather than being it. A plain `let` and deliberately not `$state`:
   * it is written from inside the frame loop, and a rune written there is a
   * loop. Nothing reads it but the loop, so nothing needs to know it moved.
   *
   * Seeded from the prop so a screen that opens on a split already made shows it
   * made, rather than playing the whole merge at the reader on arrival. Read
   * through `untrack` because taking the *initial* value is the whole point, and
   * that is the one reading Svelte is right to warn about everywhere else.
   */
  let shown = untrack(() => merge) ?? 0;

  /**
   * How far out a soul still counts as arrived. The core as drawn plus every
   * bit of it the wobble can spend, because a berth on the outer shell is
   * *inside* the core and the stray riding it is not — tested at the radius
   * itself, those souls crossed the boundary and came back as they milled, and
   * the ink and the world's own occlusion flickered with them. The dot's own
   * width is added in the shader, where it is known.
   *
   * The room is measured against the full `core` because that is what the
   * berths are packed in; only the boundary itself grows.
   */
  const reach = $derived(
    core > 0 ? drawn + berthRoom(souls.length, core) * Math.max(0, visual.berthWobble) : 0,
  );

  $effect(() => {
    syncSoulUniforms(material, visual, bleed, reach, lean);
    invalidate();
  });

  $effect(() => {
    syncSpawnUniforms(spawnMaterial, visual, bleed, reach, lean);
    invalidate();
  });

  useTask((delta) => {
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
    const riding = lines.length ? ridersOf(visual, souls.length, riders) : 0;

    // Souls are spread across the whole harness rather than taking loops in
    // order: at eight anchors there are far more loops than souls, and modulo
    // would crowd every one of them onto the first few pairs. The line is fixed
    // by the soul's own index and not by how many ride, so buying a rider adds
    // a soul to a line instead of dealing the swarm again.
    const stride = lines.length / Math.max(1, souls.length);

    // Where a soul crossing to the core leaves its orbit, and how far it may
    // stray once it is there. The stray is spent on three axes, so it is divided
    // by their diagonal first — at full wobble the *corner* of the box is the
    // half-gap, and two neighbours at their furthest still do not meet.
    const enter = Math.max(0, Math.min(0.999, visual.berthEnter));
    const room = core > 0
      ? (berthRoom(souls.length, core) * Math.max(0, visual.berthWobble)) / Math.sqrt(3)
      : 0;

    // The swarm catching up to the slider. Exponential rather than a fixed
    // ramp, so a drag is answered at once and only the tail of it is slow —
    // which is the difference between a laggy control and a heavy one.
    //
    // Written against `delta` and not against a frame, so the drag takes the
    // same wall-clock time on any machine. The `exp` is what makes that exact
    // rather than approximate at low frame rates.
    if (merge !== undefined) {
      const lag = Math.max(0, visual.mergeLag);

      shown = lag > 1e-3 ? shown + (merge - shown) * (1 - Math.exp(-delta / lag)) : merge;
    }

    // The marks, before the souls that wear them: a hatching dot is scaled as it
    // is placed, and the flare below rides the matrix that placement writes.
    // The smallest wins, so an index lit twice inside one life shows the newer
    // arrival rather than the older one finishing.
    hatches.fill(1);

    spawns.marks.forEach((mark) => {
      const t = lifeOf(mark, elapsed, visual.spawnLife);
      if (t >= 1 || mark.index < 0 || mark.index >= SOUL_CAPACITY) return;

      hatches[mark.index] = Math.min(hatches[mark.index], hatchOf(t, visual.spawnRise));
    });

    souls.forEach((soul, i) => {
      // A soul is the world's until the split says otherwise. Overwritten below
      // for anything crossing; a rider is on the world's own harness and so is
      // never anything else.
      stays.array[i] = 1;

      if (soul.place < riding) {
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

        // Radial, and after the placement rather than inside it: the orbit is
        // still the orbit, and this is only how far out along it the soul is.
        if (merge !== undefined) {
          const travel = travelOf(soul, shown, souls.length, visual.crossing);

          // The same figure the crossing is drawn from, spent a second time as
          // how much of the world's silhouette this soul is subject to.
          stays.array[i] = travel;

          dummy.position.multiplyScalar(settleScale(soul, travel, visual));

          // And then off the orbit altogether, into the core. Straight, which
          // the harness's chord objection would forbid — except that both ends
          // of this are already inside the world, so there is no sphere for a
          // chord to cut through.
          //
          // Its own wobble rides the berth rather than being dropped for it: the
          // rate and phase are the soul's, so the arrival is decorrelated for
          // free and a core of arrivals mills instead of pulsing as one.
          if (core > 0 && travel > enter) {
            const arrived = Math.min(1, (travel - enter) / Math.max(1e-6, 1 - enter));
            const stray = room * Math.sin(elapsed * soul.wobbleRate + soul.phase);

            berthOf(rankOf(soul, souls.length), souls.length, core, berth);

            // A second phase for the two off-axis strays, so a berth is wandered
            // around rather than walked up and down one line.
            dummy.position.lerp(
              berth.set(
                berth.x + stray,
                berth.y + room * Math.cos(elapsed * soul.wobbleRate * 0.8 + soul.phase * 2),
                berth.z + room * Math.sin(elapsed * soul.wobbleRate * 1.3 + soul.phase * 3),
              ),
              arrived,
            );
          }
        }
      }

      // The floor is in px and stays there: a small widget wants dots and not
      // dust whatever size the world it is holding claims to be. The hatch is
      // applied past it — an arriving soul is *not* there yet, and a floor that
      // held it at a pixel would be a dot that pops in before its own flare.
      dummy.scale.setScalar(Math.max(soul.size / Math.max(0.05, size), floor) * hatches[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.count = souls.length;
    mesh.instanceMatrix.needsUpdate = true;
    stays.needsUpdate = true;

    // The flare rides whichever matrix the loop above just wrote for its own
    // index — copied wholesale, so it carries every soul's own position
    // whether it is orbiting, riding a loop or crossing into the core, without
    // this loop having to know which.
    if (spawnMesh) {
      let drawnSpawn = 0;

      spawns.marks.forEach((mark) => {
        const t = lifeOf(mark, elapsed, visual.spawnLife);
        if (t >= 1 || mark.index < 0 || mark.index >= souls.length) return;

        const base = mark.index * 16;
        spawnMesh.instanceMatrix.array.set(
          mesh.instanceMatrix.array.subarray(base, base + 16),
          drawnSpawn * 16,
        );

        const spawnSize = Math.max(0, visual.spawnSize) / Math.max(0.05, size);

        spawnSizes.setX(drawnSpawn, spawnSize * swellOf(t, visual.spawnRise));
        spawnSpins.setX(drawnSpawn, (elapsed - mark.born) * visual.spawnSpin);
        spawnStays.setX(drawnSpawn, stays.array[mark.index]);

        drawnSpawn++;
      });

      spawnMesh.count = drawnSpawn;
      spawnMesh.instanceMatrix.needsUpdate = true;
      spawnSizes.needsUpdate = true;
      spawnSpins.needsUpdate = true;
      spawnStays.needsUpdate = true;
    }

    invalidate();
  });

  onDestroy(() => {
    spawnGeometry.dispose();
    spawnMaterial.dispose();
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

<T.InstancedMesh
  bind:ref={spawnMesh}
  args={[spawnGeometry, spawnMaterial, SPAWN_CAPACITY]}
  frustumCulled={false}
  renderOrder={RENDER_ORDER.spawn}
/>
