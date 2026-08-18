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

  let { visual, loops, zoom, size = 1, rim = 1 }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createHarnessMaterial();

  let geometry = $state<THREE.BufferGeometry>();

  // Widened to quads, because a line cannot carry a width — `ribbon.ts`. The
  // width itself is a uniform, so dragging it never comes back through here.
  $effect(() => {
    const lines = strokeLoops(loops);
    const ribbon = buildRibbon(lines.positions, lines.levels);

    const built = new THREE.BufferGeometry();
    built.setAttribute('position', new THREE.BufferAttribute(ribbon.positions, 3));
    built.setAttribute('toward', new THREE.BufferAttribute(ribbon.toward, 3));
    built.setAttribute('side', new THREE.BufferAttribute(ribbon.sides, 1));
    built.setAttribute('level', new THREE.BufferAttribute(ribbon.marks, 1));
    built.setIndex(new THREE.BufferAttribute(ribbon.indices, 1));

    geometry = built;
    invalidate();

    return () => built.dispose();
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
