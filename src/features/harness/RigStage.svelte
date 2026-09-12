<script lang="ts">
  /**
   * The rig itself, on a world that is nobody's — the `harness` record in
   * `planet-visuals`, authored in the lab beside the real worlds. It is flat
   * because deformation reads as *size* (see memory) and a rig is not a world.
   *
   * Every anchor draws placed. This is equipment, not a job: what it shows is
   * what the harness *can* put down, so the picture moves when an upgrade does
   * and not when a countdown does. No swarm, no press, no caption — there is
   * nothing here to click.
   */
  import { PlanetView } from '$widgets/planet';
  import { harness } from '$lib/harness.svelte';
  import { rig } from '$lib/harness-visuals.svelte';
  import planetVisuals from '$data/planet-visuals';
  import { STAGE_WIDTH } from '../planet-viewport';

  /** Clear of the anchors at their largest, so a bought rig never crops. */
  const RIG_FRAME = 3.4;

  const STAGE_RATIO = 355 / 406;

  /** One anchor drawn where a world offers none, so the tab is never an empty box. */
  const shown = $derived(Math.max(1, harness.anchorsAsked));

  const anchored = $derived(Array.from({ length: shown }, () => true));

  const visual = planetVisuals.harness;

  let width = $state(0);
  const widthPx = $derived(Math.round(Math.min(width, STAGE_WIDTH)));
  const heightPx = $derived(Math.round(widthPx * STAGE_RATIO));
</script>

<div class="stage" bind:clientWidth={width}>
  {#if widthPx > 0}
    <PlanetView
      {visual}
      {widthPx}
      {heightPx}
      frame={RIG_FRAME}
      backgroundToken="--surface"
      clockKey="rig"
      anchors={rig.anchors}
      {anchored}
      harness={rig.harness}
      riders={harness.riders}
    />
  {/if}
</div>

<style>
  .stage {
    position: relative;
    display: flex;
    justify-content: center;
  }
</style>
