<!--
  The sleeve a crowded cohort wears — a translucent tube swung around its band's
  mean orbit, one mesh per band and each at its own strength.

  A band is a clump and not a wire (see `orbit.ts`), and past a certain size the
  dots stop being countable: what the eye is reading by then is a *density*, and
  a hundred separate marks is a worse picture of one than a volume is. So this is
  the clump's own body, drawn under the dots that are still in it.

  It is a patchy thing and not a shell, and the count buys how patchy — the ink
  of what survives the cut is fixed. That is the difference between souls you
  could not draw and a tube fading in behind the ones you could; see
  `swarmTubeFragment`, which is where the whole of it actually lives.

  It answers to the count and to nothing else, which is why it is not the ring's
  job: `OrbitRing` draws a *lane*, on demand, because someone is pointing at it.
  This is the world saying how many.
-->
<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import type { WorldClock } from './clock';
  import { createSwarmTubeMaterial, syncSwarmTubeUniforms } from './material';
  import { bandFrameOf, createPacing, rateOf, volumeOf, type SwarmVisual } from './orbit';
  import { RENDER_ORDER } from './stack';

  interface Props {
    /** Where the bands are. The same visual the swarm is placing its dots from. */
    visual: SwarmVisual;
    /** Souls per cohort, in cohort order — the rows the swarm is dealt from. */
    counts: number[];
    /** The world's own clock, advanced by the scene and only read here. */
    clock: WorldClock;
    /**
     * How long one of each cohort's lives takes, in seconds, same rows. A quick
     * cohort's sleeve flows quickly — see `rateOf`. Absent falls back to the
     * authored doubling, which is the lab.
     */
    pace?: number[];
    /**
     * How far the body's outline bleeds past its surface, in body radii. The
     * sleeve is cut at the body's *drawn* edge, exactly where the dots are.
     */
    bleed?: number;
    /**
     * How much of each band is riding the harness, 0…1, same rows. That much of
     * the sleeve has left the orbit for the lines — see `LineVolume`, which
     * fills by the same share. Absent is nobody riding.
     */
    shares?: number[];
  }

  let { visual, counts, clock, pace, bleed = 0, shares }: Props = $props();

  /**
   * Around the ring and around the section. The ring gets fewer spans than
   * `ringEdges` needs for its line — a stroke shows a facet as a kink and a
   * shaded surface only shows one where the light changes, and this has no light.
   */
  const TUBE_SPANS = 96;
  const TUBE_RINGS = 10;

  const { invalidate } = useThrelte();

  const bands = $derived(counts.length);

  /**
   * One sleeve apiece, built for a roster and a visual. Baked into its band's
   * plane rather than oriented by a transform: the geometry is then in the same
   * frame the dots are placed into, and there is no rotation for a mesh and a
   * soul to disagree about.
   *
   * A material each, and that is the whole reason they are separate meshes — the
   * strength is a uniform, and a uniform is per material.
   */
  const sleeves = $derived.by(() => {
    const built: { geometry: THREE.TorusGeometry; material: THREE.ShaderMaterial }[] = [];
    const width = Math.max(1e-3, visual.tubeWidth);

    for (let band = 0; band < bands; band++) {
      const frame = bandFrameOf(band, visual);

      const geometry = new THREE.TorusGeometry(
        frame.radius, width, TUBE_RINGS, TUBE_SPANS,
      );

      geometry.applyMatrix4(new THREE.Matrix4().makeBasis(
        new THREE.Vector3(frame.ux, frame.uy, frame.uz),
        new THREE.Vector3(frame.vx, frame.vy, frame.vz),
        new THREE.Vector3(frame.nx, frame.ny, frame.nz),
      ));

      built.push({ geometry, material: createSwarmTubeMaterial() });
    }

    return built;
  });

  $effect(() => {
    const held = sleeves;

    return () => held.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
  });

  $effect(() => {
    sleeves.forEach(({ material }) => syncSwarmTubeUniforms(material, visual, bleed));
    invalidate();
  });

  /** How fast each band turns, as a multiple of `speed` — `SoulSwarm`'s own row. */
  const rates = $derived(
    Array.from({ length: bands }, (unused, band) => rateOf(band, visual, pace)),
  );

  /**
   * And the clocks those rates run. Its own rather than the swarm's, because the
   * two are in different components and a clock that carried across would be a
   * value written inside one frame loop and read inside another. It converges on
   * the same numbers from the same purchases, which is the whole point of
   * `createPacing` holding a shift instead of integrating.
   */
  const pacing = createPacing();

  /**
   * A count that has moved is a strength that has moved, and on-demand rendering
   * means the loop below only runs on frames somebody asked for. This is the ask
   * — the rule `OrbitRing` keeps for a purchase.
   */
  $effect(() => {
    counts.length;
    counts.some((count) => count > 0);
    shares;

    invalidate();
  });

  useTask(() => {
    const elapsed = clock.elapsed;

    pacing.follow(rates, elapsed);

    let flowing = false;

    sleeves.forEach(({ material }, band) => {
      // How far the band has grown, spent on how much of the sleeve is filled.
      // The ink of a filled patch is authored and never touched here — that
      // separation is the mark, not a detail of it. See `swarmTubeFragment`.
      const grown = volumeOf(counts[band] ?? 0, visual) * (1 - (shares?.[band] ?? 0));

      material.uniforms.uCover.value = grown * Math.min(1, Math.max(0, visual.tubeCover));
      material.uniforms.uPhase.value = pacing.timeOf(band, elapsed) * visual.tubeFlow;

      if (grown > 0) flowing = true;
    });

    // Only while something is actually travelling. A still sleeve and an empty
    // roster ask for nothing, which is what lets a screen full of these cost
    // what a still costs.
    if (flowing && visual.tubeFlow > 0) invalidate();
  });
</script>

<!-- Drawn at alpha 0 rather than hidden, as the rings are: a band under the
     threshold discards in its first statement, and the branch would cost more to
     keep reactive than the draw costs. -->
{#each sleeves as sleeve, band (band)}
  <T.Mesh
    geometry={sleeve.geometry}
    material={sleeve.material}
    frustumCulled={false}
    renderOrder={RENDER_ORDER.soulVolume}
  />
{/each}
