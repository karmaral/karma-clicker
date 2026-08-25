<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy, type Snippet } from 'svelte';
  import type * as THREE from 'three';
  import PlanetCore from './PlanetCore.svelte';
  import { buildGeometry, trimGeometryCache } from './geometry';
  import { readInkRamp } from './ink';
  import {
    createBurstMaterial, createOutlineMaterial, createSurfaceMaterial,
    syncBurstUniforms, syncOutlineUniforms, syncSurfaceUniforms, syncVeilUniforms,
    veilMaterialFor,
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
     * How far the veil has turned — its own integral, not the body's. Kept by
     * the scene for the reason `spinAngle` is: it comes off the world's one
     * clock, and a body that integrated either would be a second clock for it.
     */
    veilAngle?: number;
    /**
     * The harvest's alignment, −1, 0 or +1. It is what the **core** says, and so
     * it is also what decides there is one: absent, no core is mounted and the
     * body's window stays shut, because a window onto nothing is a hole.
     *
     * Game state, so it is a prop rather than a `PlanetVisual` field — the same
     * separation `cohorts` and `merge` already keep one layer up.
     */
    alignment?: number;
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

  let {
    visual, zoom, spinAngle = 0, veilAngle = 0, alignment, pulse, pulses, children, standing,
  }: Props = $props();

  /** One mark, two halves — see `alignment`. Neither is drawn without it. */
  const hasCore = $derived(alignment !== undefined && visual.core > 0);

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
    syncSurfaceUniforms(surface, visual, hasCore ? visual.clarity : 0);
    syncOutlineUniforms(outline, visual, ramp, zoom);

    if (pulse) syncBurstUniforms(burst, outline, pulse, ramp, zoom);

    invalidate();
  });

  /**
   * Only the mode in force exists. Both materials is a second shader compile
   * for a picture nobody asked for, across as many `PlanetView`s as a screen
   * mounts — and the hatch is the expensive one, so an alpha veil must not be
   * made to carry it. Torn down on `veil` too, so a world without one compiles
   * no veil shader at all.
   */
  let veilMaterial = $state.raw<THREE.ShaderMaterial>();

  $effect(() => {
    if (visual.veil <= 0) return;

    const made = veilMaterialFor(visual.veilInk);

    veilMaterial = made;
    invalidate();

    return () => {
      made.dispose();
      veilMaterial = undefined;
    };
  });

  // Kept apart from the effect above on purpose: that one writes `veilMaterial`
  // and this one reads it, and a single effect doing both is a loop with no exit.
  $effect(() => {
    if (!veilMaterial) return;

    syncVeilUniforms(veilMaterial, visual, hasCore ? visual.clarity : 0);
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
        <!-- Ordered, unlike the outline above it: the surface is transparent
             (the window is an alpha) and so it sorts among the marks rather
             than being drawn ahead of them all. `stack.ts` has the reasoning. -->
        <T.Mesh {geometry} material={surface} renderOrder={RENDER_ORDER.body} />

        {@render standing?.()}
      </T.Group>

      <!-- Its own angle, and that is the whole of why it is not in the group
           above: weather is not bolted to the ground it is over. Inside the
           hold, so object-space Y is still the world's axis — the pole mask
           means what it says however the world is held, and is untouched by
           the veil's own turn.

           frustumCulled off: the bounding sphere is the body's, and the vertex
           shader has since pushed this out past it. -->
      {#if veilMaterial}
        <T.Group rotation.y={veilAngle}>
          <T.Mesh
            {geometry}
            material={veilMaterial}
            renderOrder={RENDER_ORDER.veil}
            frustumCulled={false}
          />
        </T.Group>
      {/if}

      <!-- Outside the spin, unlike everything above it: a reading is not ground,
           and a core that turned with the surface would be saying something
           about the world rather than about the harvest. It sorts under the body
           and under the hull both, which is `stack.ts`'s bottom entry — so the
           front blends over it and its own feathered rim fades onto ink. -->
      {#if hasCore}
        <PlanetCore {visual} lean={alignment ?? 0} />
      {/if}

      {@render children?.()}
    </T.Group>
  </T.Group>
</T.Group>
