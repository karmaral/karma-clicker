<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy, type Snippet } from 'svelte';
  import { buildGeometry, trimGeometryCache } from './geometry';
  import { readInkRamp } from './ink';
  import {
    createBurstMaterial, createOutlineMaterial, createSurfaceMaterial,
    syncBurstUniforms, syncOutlineUniforms, syncSurfaceUniforms,
  } from './material';
  import { fadeOf, lifeOf, type Pulses, type PulseVisual } from './pulse';
  import { RENDER_ORDER } from './stack';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** Pixels per world unit. The outline is authored in px, so it needs this. */
    zoom: number;
    /**
     * The burst, and the clock it is timed by. Here rather than in a component
     * of its own because it is drawn from the body's *own* geometry — a hull of
     * the silhouette, terrain and all — and because it writes the body outline's
     * flash, which is this material and nobody else's.
     */
    pulse?: PulseVisual;
    pulses?: Pulses;
    /**
     * How far the world has turned. Kept by the scene rather than here: the
     * swarm reads it too, and a body that integrated its own angle would be a
     * second clock for the same rotation.
     */
    spinAngle?: number;
    /**
     * Drawn inside the body's hold but outside its spin — orbits and markers
     * share the world's axis without being dragged round by its surface.
     */
    children?: Snippet;
    /**
     * Inside the spin, for anything that is *on* the surface rather than around
     * it. The same slot the terrain occupies, so it turns with the ground.
     */
    standing?: Snippet;
  }

  let { visual, zoom, spinAngle = 0, pulse, pulses, children, standing }: Props = $props();

  const { invalidate } = useThrelte();
  const ramp = readInkRamp();
  const surface = createSurfaceMaterial();
  const outline = createOutlineMaterial();
  const burst = createBurstMaterial();

  /** Reads only the shape fields, so band sliders never rebuild the mesh. */
  const geometry = $derived.by(() => {
    const built = buildGeometry(visual);
    trimGeometryCache();

    return built;
  });

  $effect(() => {
    geometry;
    syncSurfaceUniforms(surface, visual);
    syncOutlineUniforms(outline, visual, ramp, zoom);

    if (pulse) syncBurstUniforms(burst, outline, pulse, ramp, zoom);

    invalidate();
  });

  /**
   * The hull's fade and the outline's flash off one life, so the edge cannot
   * still be white after the shadow behind it has gone. Written straight to the
   * uniforms and never through the reactive graph — a flash is a frame's worth
   * of geometry, the rule `Halo` and `Sparks` already draw by.
   */
  useTask(() => {
    if (!pulse || !pulses) return;

    const t = lifeOf(pulses.burst, pulses.now, pulse.burstLife);
    const fade = t >= 1 ? 0 : fadeOf(t);

    burst.uniforms.uFade.value = fade;
    outline.uniforms.uFlash.value = fade;
  });

  onDestroy(() => {
    surface.dispose();
    outline.dispose();
    burst.dispose();
  });
</script>

<!-- Nested rather than one Euler, so the order is the sliders' and not three's:
     lean is a screen-plane roll however far the pole is tipped, and turn is
     about the world's own axis however it is held. Negated because `lean` is
     authored to the right and +Z takes the pole left. -->
<T.Group rotation.z={-visual.lean}>
  <T.Group rotation.x={visual.tilt}>
    <T.Group rotation.y={visual.turn}>
      <T.Group rotation.y={spinAngle}>
        <!-- Inside the spin like the terrain it is a hull of: a silhouette
             taken from a world that has since turned is the wrong shape. -->
        {#if pulse && pulse.burstWidth > 0}
          <T.Mesh {geometry} material={burst} renderOrder={RENDER_ORDER.burst} />
        {/if}

        {#if visual.outline > 0}
          <T.Mesh {geometry} material={outline} />
        {/if}
        <T.Mesh {geometry} material={surface} />

        {@render standing?.()}
      </T.Group>

      {@render children?.()}
    </T.Group>
  </T.Group>
</T.Group>
