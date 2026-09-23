<!--
  The lines the cohorts ride, one mesh per band and each at its own strength.

  Two things ask for a ring and they ask differently. A hover holds one open for
  as long as the pointer is on the row; an arrival flashes one and lets it go.
  Both are the same circle at the same weight, so what separates them is ink —
  which is why a band's strength is a uniform here rather than a second mark.

  A band is a clump and not a wire (see `orbit.ts`), so this is the band's *mean*
  and the dots straddle it. That is what the swarm's own size bump is for: the
  ring names the lane, the grown dots say which of the overlapping shells rides it.
-->
<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy, untrack } from 'svelte';
  import * as THREE from 'three';
  import type { WorldClock } from './clock';
  import { createHarnessMaterial, syncOrbitRingUniforms } from './material';
  import { ringEdges, type SwarmVisual } from './orbit';
  import { buildRibbon } from './ribbon';
  import { RENDER_ORDER } from './stack';

  interface Props {
    /** Where the bands are. The same visual the swarm is placing its dots from. */
    visual: SwarmVisual;
    /** Which bands are being pointed at, in cohort order. Its length is the roster. */
    lit: boolean[];
    /**
     * A running count of souls bought per band, same rows. Each rise flashes that
     * ring — counts and not times, and only the rise is read, for the reason
     * `yields` is a count: the world's clock ticks in quarter seconds, so a
     * timestamp taken here would be the tick and not the purchase.
     */
    bought?: number[];
    /**
     * How much of each band rides the harness, 0…1. A hover holds the ring at
     * what is left on it — a band all on its lines is named by them instead.
     */
    shares?: number[];
    /** The world's own clock, advanced by the scene and only read here. */
    clock: WorldClock;
    /** Pixels per world unit. The line's weight is authored in px. */
    zoom: number;
    /** The world's own size, which divides that weight — see `Harness`. */
    size?: number;
    /** Where the body is *seen* to end, in body radii. Both inks are cut at it. */
    rim?: number;
  }

  let { visual, lit, bought, shares, clock, zoom, size = 1, rim = 1 }: Props = $props();

  const { invalidate } = useThrelte();

  /** What a pointer holds a ring at. The tuned figure — see `syncOrbitRingUniforms`. */
  const HOVER_ALPHA = 0.5;

  /**
   * And what an arrival opens one to before it goes. Above the hover, because a
   * flash that peaked at the resting strength would read as the pointer moving
   * rather than as something happening out on the world.
   */
  const FLASH_ALPHA = 0.9;

  /** Seconds. Long enough to be seen across the disc, short enough not to queue. */
  const FLASH_LIFE = 0.7;

  const bands = $derived(lit.length);

  /**
   * One ring apiece, built once for a roster and a visual — a circle is 128 spans
   * and eight of them are nothing, so they are all made up front and the frame
   * only chooses how hard to draw each. Rebuilt when the swarm's own shape moves,
   * because that is where the bands are.
   *
   * A material each, and that is the whole reason they are separate meshes: the
   * strength is a uniform, and a uniform is per material.
   */
  const rings = $derived.by(() => {
    const built: { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial }[] = [];

    for (let band = 0; band < bands; band++) {
      const ribbon = buildRibbon(ringEdges(band, visual));

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(ribbon.positions, 3));
      geometry.setAttribute('toward', new THREE.BufferAttribute(ribbon.toward, 3));
      geometry.setAttribute('side', new THREE.BufferAttribute(ribbon.sides, 1));
      geometry.setAttribute('level', new THREE.BufferAttribute(ribbon.marks, 1));
      geometry.setIndex(new THREE.BufferAttribute(ribbon.indices, 1));

      built.push({ geometry, material: createHarnessMaterial() });
    }

    return built;
  });

  $effect(() => {
    const held = rings;

    return () => held.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
  });

  $effect(() => {
    rings.forEach(({ material }) => syncOrbitRingUniforms(material, zoom, size, rim));
    invalidate();
  });

  /**
   * When each band last flashed, in world seconds, and what `bought` held when it
   * did. Plain arrays rather than runes: they are read inside the frame loop and
   * nothing renders from them — the rule `SoulSwarm` keeps for `hatches`.
   */
  let flashedAt: number[] = [];
  let lastBought: number[] = [];

  /**
   * Whether the counts have been looked at once. Everything standing at mount is
   * the world as it was found — a restored save, or a screen opened long after
   * the buying — and none of it is an arrival to announce. Only what happens
   * from the second look on is.
   *
   * A band that has never been seen is read as 0 rather than skipped, so that a
   * cohort's *first* purchase, which is the same beat its row appears, is the
   * one flash that should least be missed.
   */
  let isSeeded = false;

  /**
   * The rise is caught here and not in the loop below, because on-demand
   * rendering means that loop only runs on frames somebody asked for: a purchase
   * made while the world was sitting still would be seen a frame late, or not at
   * all. This is the ask.
   */
  $effect(() => {
    const counts = bought ?? [];
    const now = untrack(() => clock.elapsed);

    let woke = false;

    for (let band = 0; band < bands; band++) {
      const total = counts[band] ?? 0;

      if (isSeeded && total > (lastBought[band] ?? 0)) {
        flashedAt[band] = now;
        woke = true;
      }

      lastBought[band] = total;
    }

    isSeeded = true;

    if (woke) invalidate();
  });

  $effect(() => {
    // The subscription is the point. A hover changes no geometry and no uniform
    // either effect above owns — the loop below picks it up — so reading `lit`
    // here is what asks for the one frame that shows it.
    lit.some(Boolean);
    shares;

    invalidate();
  });

  useTask(() => {
    const elapsed = clock.elapsed;

    let moving = false;

    rings.forEach(({ material }, band) => {
      const at = flashedAt[band];
      const t = at === undefined ? 1 : Math.min(1, Math.max(0, (elapsed - at) / FLASH_LIFE));

      // Out fast and then slow, so the flash lands on the instant it is about and
      // leaves without a tail that would read as a second state.
      const flash = t >= 1 ? 0 : FLASH_ALPHA * (1 - t) * (1 - t);

      if (flash > 0) moving = true;

      const held = lit[band] ? HOVER_ALPHA * (1 - (shares?.[band] ?? 0)) : 0;

      material.uniforms.uAlpha.value = Math.max(held, flash);
    });

    // Only while a flash is still going. Held hovers and an idle world ask for
    // nothing, which is what lets a screen full of these cost what a still costs.
    if (moving) invalidate();
  });

  onDestroy(() => {
    flashedAt = [];
    lastBought = [];
  });
</script>

<!-- Drawn at alpha 0 rather than hidden: a ring is 256 triangles and there are
     eight, so the branch would cost more to keep reactive than the draw costs. -->
{#each rings as ring, band (band)}
  <T.Mesh
    geometry={ring.geometry}
    material={ring.material}
    frustumCulled={false}
    renderOrder={RENDER_ORDER.orbitRing}
  />
{/each}
