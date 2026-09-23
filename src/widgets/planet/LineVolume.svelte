<!--
  The sleeve a band wears once it rides — `SoulVolume`'s tube, swept along the
  loops its lines claimed instead of around its orbit. The two split one sleeve
  by the riding share: what leaves the ring arrives here, so the crowd reads as
  moving onto the harness rather than as a second body appearing.

  Inside the spin, because the loops are: a sleeve and the line it is on turn
  together. One merged mesh per band, since the strength is a uniform and a
  band's loops share it.
-->
<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import * as THREE from 'three';
  import type { WorldClock } from './clock';
  import type { HarnessLoop } from './harness';
  import { createSwarmTubeMaterial, syncSwarmTubeUniforms } from './material';
  import { bandFrameOf, createPacing, rateOf, volumeOf, type SwarmVisual } from './orbit';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: SwarmVisual;
    /** Souls per band, the rows the swarm is dealt from. */
    counts: number[];
    /** The whole harness. Each band keeps the loops of the families it claimed. */
    loops: HarnessLoop[];
    /** The families each band rides — `SoulSwarm`'s own row. */
    claims: number[][];
    /** How much of each band rides, 0…1 — the share `SoulVolume` gives up. */
    shares: number[];
    clock: WorldClock;
    pace?: number[];
    bleed?: number;
  }

  let { visual, counts, loops, claims, shares, clock, pace, bleed = 0 }: Props = $props();

  /** Along a loop and around it. A loop is ~54 points, so the path needs no more. */
  const TUBE_SPANS = 64;
  const TUBE_RINGS = 8;

  /**
   * Share of a line's length each end thins over. A petal closes on its anchor
   * and a link runs between two, so every sleeve here has ends to close.
   */
  const TAPER = 0.12;

  const { invalidate } = useThrelte();

  /**
   * One loop's tube, with its u counted in *orbit turns* rather than 0…1: a
   * line of half the band's circumference runs u 0…0.5. The pattern is authored
   * in crests per turn and the flow in turns per beat, so on those units a crest
   * is the ring's size and moves at the ring's speed, whatever the line's length.
   * The 0…1 the taper needs goes to its own attribute, `along`.
   */
  function tubeOf(loop: HarnessLoop, width: number, around: number) {
    const points = [];

    for (let i = 0; i < loop.points.length; i += 3) {
      points.push(new THREE.Vector3(loop.points[i], loop.points[i + 1], loop.points[i + 2]));
    }

    const tube = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points), TUBE_SPANS, width, TUBE_RINGS, false,
    );

    const uv = tube.getAttribute('uv');
    const along = new Float32Array(uv.count);
    const turns = loop.length / Math.max(1e-6, around);

    for (let i = 0; i < uv.count; i++) {
      along[i] = uv.getX(i);
      uv.setX(i, along[i] * turns);
    }

    tube.setAttribute('along', new THREE.BufferAttribute(along, 1));

    return tube;
  }

  /** Every tube of a band as one geometry — offsets folded into the indices. */
  function mergeTubes(tubes: THREE.BufferGeometry[]) {
    const merged = new THREE.BufferGeometry();
    const names = ['position', 'normal', 'uv', 'along'] as const;
    const indices: number[] = [];
    let offset = 0;

    names.forEach((name) => {
      const size = tubes[0].getAttribute(name).itemSize;
      const total = tubes.reduce((sum, tube) => sum + tube.getAttribute(name).array.length, 0);
      const array = new Float32Array(total);
      let at = 0;

      tubes.forEach((tube) => {
        const source = tube.getAttribute(name).array as Float32Array;

        array.set(source, at);
        at += source.length;
      });

      merged.setAttribute(name, new THREE.BufferAttribute(array, size));
    });

    tubes.forEach((tube) => {
      tube.getIndex()?.array.forEach((index) => indices.push(index + offset));
      offset += tube.getAttribute('position').count;
    });

    merged.setIndex(indices);

    return merged;
  }

  const sleeves = $derived.by(() => {
    const width = Math.max(1e-3, visual.tubeWidth);

    return counts.map((unused, band) => {
      const families = claims[band] ?? [];
      const own = loops.filter((loop) => families.includes(loop.family));
      if (!own.length) return undefined;

      const around = Math.PI * 2 * bandFrameOf(band, visual).radius;
      const tubes = own.map((loop) => tubeOf(loop, width, around));

      const geometry = mergeTubes(tubes);
      tubes.forEach((tube) => tube.dispose());

      const material = createSwarmTubeMaterial();
      material.uniforms.uTaper.value = TAPER;

      return { band, geometry, material };
    }).filter((sleeve) => sleeve !== undefined);
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

  /** The bands' own clocks, so a sleeve flows at its orbit's pace — see `SoulVolume`. */
  const rates = $derived(counts.map((unused, band) => rateOf(band, visual, pace)));
  const pacing = createPacing();

  $effect(() => {
    counts.length;
    shares;

    invalidate();
  });

  useTask(() => {
    const elapsed = clock.elapsed;

    pacing.follow(rates, elapsed);

    let flowing = false;

    sleeves.forEach(({ band, material }) => {
      const grown = volumeOf(counts[band] ?? 0, visual) * (shares[band] ?? 0);

      material.uniforms.uCover.value = grown * Math.min(1, Math.max(0, visual.tubeCover));
      material.uniforms.uPhase.value = pacing.timeOf(band, elapsed) * visual.tubeFlow;

      if (grown > 0) flowing = true;
    });

    if (flowing && visual.tubeFlow > 0) invalidate();
  });
</script>

{#each sleeves as sleeve (sleeve.band)}
  <T.Mesh
    geometry={sleeve.geometry}
    material={sleeve.material}
    frustumCulled={false}
    renderOrder={RENDER_ORDER.soulVolume}
  />
{/each}
