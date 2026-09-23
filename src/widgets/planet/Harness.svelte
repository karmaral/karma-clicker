<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { strokeLoops, type HarnessLoop, type HarnessVisual } from './harness';
  import { createHarnessMaterial, syncHarnessUniforms } from './material';
  import { buildRibbon } from './ribbon';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: HarnessVisual;
    /**
     * Built by the scene rather than here, because the swarm reads the same
     * loops — a soul riding a line and the line it rides must be one curve.
     */
    loops: HarnessLoop[];
    /** The families bands ride — see `claimFamilies`. Absent is all of them, the lab. */
    claims?: number[];
    /** The families a hover names. The rest fade as unridden ones do; absent or empty fades none. */
    lit?: number[];
    /** Pixels per world unit. The line's weight is authored in px. */
    zoom: number;
    /**
     * The world's own size, which divides that weight. A prop rather than an
     * adjusted `HarnessVisual`, the way the swarm and the sparks take it: the
     * geometry does not read it, so a derived copy would rebuild ten thousand
     * spans on every drag of the size slider.
     */
    size?: number;
    /**
     * Where the body is *seen* to end, in body radii — its outline's outer edge,
     * not its surface. Both halves of the ink rule are cut at it, so a line
     * neither reappears inside the outline nor changes ink while still over it.
     */
    rim?: number;
  }

  let { visual, loops, claims, lit, zoom, size = 1, rim = 1 }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createHarnessMaterial();

  let geometry = $state<THREE.BufferGeometry>();

  /** Each span's family, kept so a hover rewrites one attribute instead of the ribbon. */
  let families: Int16Array = new Int16Array(0);

  // Widened to quads, because a line cannot carry a width — `ribbon.ts`. The
  // width itself is a uniform, so dragging it never comes back through here.
  $effect(() => {
    const lines = strokeLoops(loops, claims);
    const ribbon = buildRibbon(lines.positions, lines.levels);

    // Per span, so each of its four corners.
    const idle = new Float32Array(lines.idle.length * 4);
    lines.idle.forEach((value, span) => idle.fill(value, span * 4, span * 4 + 4));

    const built = new THREE.BufferGeometry();
    built.setAttribute('position', new THREE.BufferAttribute(ribbon.positions, 3));
    built.setAttribute('toward', new THREE.BufferAttribute(ribbon.toward, 3));
    built.setAttribute('side', new THREE.BufferAttribute(ribbon.sides, 1));
    built.setAttribute('level', new THREE.BufferAttribute(ribbon.marks, 1));
    built.setAttribute('idle', new THREE.BufferAttribute(idle, 1));
    built.setAttribute('focus', new THREE.BufferAttribute(new Float32Array(idle.length), 1));
    built.setIndex(new THREE.BufferAttribute(ribbon.indices, 1));

    families = lines.families;
    geometry = built;
    invalidate();

    return () => built.dispose();
  });

  $effect(() => {
    if (!geometry) return;

    const named = lit ?? [];
    const focus = geometry.getAttribute('focus') as THREE.BufferAttribute;
    const array = focus.array as Float32Array;

    families.forEach((family, span) => {
      array.fill(named.includes(family) ? 1 : 0, span * 4, span * 4 + 4);
    });

    focus.needsUpdate = true;
    material.uniforms.uFocus.value = named.length ? 1 : 0;
    invalidate();
  });

  $effect(() => {
    syncHarnessUniforms(material, visual, zoom, size, rim);
    invalidate();
  });

  onDestroy(() => material.dispose());
</script>

{#if geometry}
  <T.Mesh {geometry} {material} frustumCulled={false} renderOrder={RENDER_ORDER.harness} />
{/if}
