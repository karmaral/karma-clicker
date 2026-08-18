<script lang="ts">
  /**
   * The off-screen host and the one WebGL context that draws every still world.
   * Mounted by `snapshots` on the first request and unmounted when the queue
   * goes quiet — nothing places this, and nothing should.
   */
  import { Canvas } from '@threlte/core';
  import * as THREE from 'three';
  import SnapshotRenderer from './SnapshotRenderer.svelte';

  /**
   * The box the next picture is drawn in. Threlte measures the host through a
   * ResizeObserver, so `SnapshotRenderer` sets this and then waits for the size
   * to land before it asks for a frame.
   */
  let width = $state(1);
  let height = $state(1);
</script>

<!--
  `alpha` and `preserveDrawingBuffer` are construction flags: alpha so a picture
  carries no ground of its own, and the preserved buffer so the read is safe
  whenever it happens rather than only inside the render's own task. HMR never
  reapplies either — a hard reload is the only way to change them.
-->
<div class="host" style:width="{width}px" style:height="{height}px" aria-hidden="true">
  <Canvas
    renderMode="manual"
    createRenderer={(canvas) => new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })}
  >
    <SnapshotRenderer bind:width bind:height />
  </Canvas>
</div>

<style>
  /* Off-screen rather than hidden: a display:none host measures zero. */
  .host {
    position: fixed;
    top: 0;
    left: -10000px;
    pointer-events: none;
  }
</style>
