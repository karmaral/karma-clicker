<script lang="ts">
  /**
   * Draws one world, hands back a bitmap, moves on. Lives inside the snapshot
   * canvas because that is the only place `useThrelte` reaches, and owns the
   * queue's loop for the same reason.
   */
  import { useThrelte } from '@threlte/core';
  import { tick } from 'svelte';
  import type * as THREE from 'three';
  import PlanetScene from './PlanetScene.svelte';
  import { snapshots, type SnapshotJob } from './snapshot';
  import { toStill } from './visual';

  interface Props {
    width: number;
    height: number;
  }

  let { width = $bindable(), height = $bindable() }: Props = $props();

  const { size, invalidate, renderer } = useThrelte();
  const gl = renderer as THREE.WebGLRenderer;

  let current = $state.raw<SnapshotJob>();

  /**
   * Not the world as authored: a still freezes the spin and thins the ink, and
   * `toStill` is where both are argued. The cache key is the source visual, and
   * the derivation is total, so it does not need to be in the key.
   */
  const visual = $derived(current && toStill(current.visual));

  let isDraining = false;

  /**
   * Pushed at, not polled. Nothing reactive is read here on purpose — a queue
   * the stills write to from inside their own effects cannot also be something
   * an effect watches.
   */
  $effect(() => snapshots.attach(drain));

  async function drain() {
    if (isDraining) return;

    isDraining = true;

    for (let next = snapshots.dequeue(); next; next = snapshots.dequeue()) {
      snapshots.resolve(next, await capture(next));
    }

    // The last world is left standing rather than cleared. Clearing it would
    // unmount the camera with it, and the scene is warm for the next batch —
    // the canvas's whole life is three seconds past this point anyway.
    isDraining = false;
    snapshots.scheduleRelease();
  }

  async function capture(job: SnapshotJob): Promise<ImageBitmap> {
    width = job.widthPx;
    height = job.heightPx;
    current = job;

    // The world first, then the box, then the world again: `zoom` falls out of
    // the measured size, and everything authored in pixels divides by it.
    await tick();
    await waitForSize(job);
    await tick();

    await renderOnce();

    return createImageBitmap(gl.domElement);
  }

  /**
   * Measured through a ResizeObserver, so a new box lands a frame or two after
   * the style does. The ceiling is a ceiling, not an expectation — past it the
   * picture is drawn at whatever size did land and the destination scales it.
   */
  async function waitForSize({ widthPx, heightPx }: SnapshotJob) {
    for (let i = 0; i < 12; i++) {
      if (size.current.width === widthPx && size.current.height === heightPx) return;

      await nextFrame();
    }
  }

  /**
   * Invalidating only raises the flag — three's own animation loop is what runs
   * the render stage, on some frame after this one. So the frame counter is what
   * says a picture exists, rather than a guess at how many frames to wait: a
   * capture that grabbed an unrendered buffer would come back blank and silent.
   *
   * `invalidate` and not `advance`: in `manual` mode both set the same flag, and
   * `advance` is the deprecated spelling of it.
   */
  async function renderOnce() {
    const before = gl.info.render.frame;
    invalidate();

    for (let i = 0; i < 12; i++) {
      await nextFrame();

      if (gl.info.render.frame !== before) return;
    }
  }

  function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
</script>

<!-- The body alone. No swarm, no pulse, no anchors, no harness — a still is the
     world, and everything else in the scene is something standing beside it. -->
{#if visual}
  <PlanetScene {visual} frame={current?.frame} backgroundToken={null} />
{/if}
