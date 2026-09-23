<script lang="ts">
  /**
   * `PlanetStage`'s sibling: the same world, one size up and with nothing
   * standing on it. It is the takeover's ground rather than one of its columns
   * — the whole block is the box, and the decision is laid out on top of it.
   *
   * Held to the top of that box, not centred: the split and the verb take the
   * foot, so the world takes the head of the block and the swarm strays out
   * behind the two panels either side of it.
   *
   * No click, no anchors, no harness, no sleeves — nothing here is a verb and
   * nothing here is a reading. The stage is what the decision is about, and the
   * only thing it answers to is the split.
   */
  import {
    DEFAULT_SWARM, DEFAULT_VISUAL, HARVEST_ANCHOR, HARVEST_RADIUS, PlanetView, cloneSwarm, scaleInk,
  } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import type { SwarmVisual } from '$widgets/planet';
  import type { Polarity } from '$lib/types';

  /**
   * The swarm without its tube. Bands are a reading of the cohorts and this
   * screen is not about them — the sleeves only strayed out behind the panels.
   *
   * Module scope, not a derived: `SoulVolume` rebuilds every torus when the
   * visual's identity changes, so a clone per render would be paid for in the
   * views that do wear one.
   */
  const HARVEST_SWARM: SwarmVisual = { ...cloneSwarm(DEFAULT_SWARM), tubeWidth: 0 };

  interface Props {
    id: string;
    /** Souls per cohort, in row order. Empty is a bare world, not a broken one. */
    cohorts?: number[];
    /** The share staying with the world, 0…1. Drives the whole swarm. */
    merge: number;
    /**
     * Which side this harvest lands on. It is the whole of what the world's
     * **core** says, and this stage is the only view in the game that passes one
     * — so it is also the only view where the body opens at all.
     */
    alignment: Polarity;
  }

  let { id, cohorts = [], merge, alignment }: Props = $props();

  /**
   * Drawn nearer, and inked for it: this is a push-in rather than a bigger
   * widget, so the world's px lines come up with it. See `scaleInk`.
   */
  const visual = $derived(scaleInk(planetVisuals[id] ?? DEFAULT_VISUAL, HARVEST_RADIUS));

  let width = $state(0);
  let height = $state(0);

  const widthPx = $derived(Math.round(width));
  const heightPx = $derived(Math.round(height));

  /**
   * The world at a fixed size rather than a fixed share of the box: `frame` is
   * world units across the short axis, so dividing that side by the radius
   * wanted is what keeps the planet itself still while the card around it
   * moves. The short one, whichever it is — the card is wide at a window and
   * tall at a phone, and the world should be the same world in both.
   */
  const frame = $derived(Math.min(widthPx, heightPx) / HARVEST_RADIUS);

  /**
   * Where the disc stands down that box, as a camera that has stepped *down* —
   * screen Y runs down and world Y runs up, so an anchor above the middle is a
   * negative offset. Divided by the radius because `zoom` is the radius in
   * pixels, so px over px is body radii, the units the camera is in.
   */
  const offsetY = $derived(((HARVEST_ANCHOR - 0.5) * heightPx) / HARVEST_RADIUS);
</script>

<div class="stage" bind:clientWidth={width} bind:clientHeight={height}>
  {#if widthPx > 0 && heightPx > 0}
    <PlanetView
      {visual}
      {widthPx}
      {heightPx}
      {frame}
      {offsetY}
      backgroundToken="--surface"
      swarm={HARVEST_SWARM}
      {cohorts}
      {merge}
      {alignment}
      clockKey={id}
    />
  {/if}
</div>

<style>
  /* Behind everything: the panels and the verb stand on it. */
  .stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    line-height: 0;
    pointer-events: none;
  }
</style>
