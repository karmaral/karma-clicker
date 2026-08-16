<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { strokeLoops, type HarnessLoop, type HarnessVisual } from './harness';
  import { createHarnessMaterial, syncHarnessUniforms } from './material';
  import { RENDER_ORDER } from './stack';

  interface Props {
    visual: HarnessVisual;
    /**
     * Built by the scene rather than here, because the swarm reads the same
     * loops — a soul riding a line and the line it rides must be one curve.
     */
    loops: HarnessLoop[];
  }

  let { visual, loops }: Props = $props();

  const { invalidate } = useThrelte();
  const material = createHarnessMaterial();

  let geometry = $state<THREE.BufferGeometry>();

  // Hairline, one device pixel, and no thick-line library: the width is the
  // house style and not a parameter.
  $effect(() => {
    const lines = strokeLoops(loops);

    const built = new THREE.BufferGeometry();
    built.setAttribute('position', new THREE.BufferAttribute(lines.positions, 3));
    built.setAttribute('level', new THREE.BufferAttribute(lines.levels, 1));

    geometry = built;
    invalidate();

    return () => built.dispose();
  });

  $effect(() => {
    syncHarnessUniforms(material, visual);
    invalidate();
  });

  onDestroy(() => material.dispose());
</script>

{#if geometry}
  <T.LineSegments {geometry} {material} frustumCulled={false} renderOrder={RENDER_ORDER.harness} />
{/if}
