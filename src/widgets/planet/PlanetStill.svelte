<script lang="ts">
  /**
   * A world that does not move. `PlanetView`'s pair: same props, and nothing
   * alike inside. This is a 2D canvas holding a snapshot the shared renderer
   * drew, so a page may carry any number of them at no standing cost.
   *
   * No `IntersectionObserver`, deliberately — a still off screen is a bitmap and
   * nothing else, and unmounting it would only make it come back blank.
   */
  import { snapshots } from './snapshot';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    widthPx?: number;
    heightPx?: number;
    /** World units across the short axis. Lower draws the body larger in its box. */
    frame?: number;
  }

  let { visual, widthPx = 48, heightPx, frame = 2.4 }: Props = $props();

  const height = $derived(heightPx ?? widthPx);
  const dpr = window.devicePixelRatio || 1;

  /** Identity, so an earlier ask can be dropped when a new one lands. */
  const token = {};

  let canvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const target = canvas;
    if (!target) return;

    let isCurrent = true;

    snapshots
      .request(token, { visual, widthPx, heightPx: height, frame, dpr })
      .then((bitmap) => {
        if (!isCurrent) return;

        const context = target.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, target.width, target.height);
        context.drawImage(bitmap, 0, 0, target.width, target.height);
      });

    return () => {
      isCurrent = false;
      snapshots.cancel(token);
    };
  });
</script>

<canvas
  class="planet-still"
  bind:this={canvas}
  width={Math.round(widthPx * dpr)}
  height={Math.round(height * dpr)}
  style:width="{widthPx}px"
  style:height="{height}px"
></canvas>

<style>
  .planet-still {
    display: block;
    flex: none;
  }
</style>
