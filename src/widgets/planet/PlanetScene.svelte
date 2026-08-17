<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { fromStore } from 'svelte/store';
  import * as THREE from 'three';
  import Anchors from './Anchors.svelte';
  import Halo from './Halo.svelte';
  import Harness from './Harness.svelte';
  import PlanetBody from './PlanetBody.svelte';
  import SoulSwarm from './SoulSwarm.svelte';
  import Sparks from './Sparks.svelte';
  import { placeAnchors, type AnchorVisual } from './anchor';
  import { createSurfaceField } from './field';
  import { buildLoops, trimLoopCache, type HarnessVisual } from './harness';
  import { readToken } from './ink';
  import type { SwarmVisual } from './orbit';
  import { createPulses, PULSE_CAPACITY, type PulseVisual } from './pulse';
  import type { PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** World units across the viewport's short axis — the framing, not the planet. */
    frame?: number;
    backgroundToken?: string;
    swarm?: SwarmVisual;
    /**
     * Souls per cohort. Absent or empty draws no swarm at all, so every existing
     * caller is unchanged — and a world with no cohorts is bare, not broken.
     */
    cohorts?: number[];
    anchors?: AnchorVisual;
    /** One flag per anchor. Empty draws no harness, the way `cohorts` does. */
    anchored?: boolean[];
    /** The lines between the anchors. Absent draws poles and nothing strung. */
    harness?: HarnessVisual;
    /** What a click leaves behind. Absent means the world does not answer one. */
    pulse?: PulseVisual;
    /**
     * A running count of clicks. Every rise flashes the world once, so the
     * caller owns the event and the scene only owns what it looks like.
     */
    flashes?: number;
  }

  let {
    visual,
    frame = 2.7,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    anchors,
    anchored,
    harness,
    pulse,
    flashes = 0,
  }: Props = $props();

  const { size: sizeStore, scene, invalidate } = useThrelte();
  const size = fromStore(sizeStore);

  /**
   * Threlte sizes an orthographic frustum in pixels, so `zoom` is exactly
   * pixels per world unit — which is what makes a px-authored outline hold its
   * weight at any widget size.
   */
  const zoom = $derived(Math.min(size.current.width, size.current.height) / frame);

  const hasAnchors = $derived(Boolean(anchors && anchored?.length));

  /**
   * How big this world says it is. Everything standing beside the body is
   * divided by it — the body is drawn to the framing whatever it is, so scale
   * is carried entirely by what is next to it.
   */
  const worldSize = $derived(Math.max(0.05, visual.size));

  /**
   * The anchors as this world wears them. Adjusted here rather than inside
   * `Anchors`, because `placeAnchors` is read from both places and a solid built
   * at one size standing on a placement computed at another is the one way this
   * can go wrong.
   */
  const poles = $derived(anchors ? { ...anchors, size: anchors.size / worldSize } : undefined);

  /**
   * A second read of the same field the mesh was built from — same seed, same
   * settings, same answer. Built here rather than lifted out of `geometry.ts`
   * because only a world with anchors pays for it, and the cost is the range
   * measure alone.
   */
  const field = $derived(hasAnchors || pulse ? createSurfaceField(visual) : undefined);

  /**
   * The nodes a line may be strung between: the *placed* ones. A harness is
   * what has been driven in, so it grows anchor by anchor instead of being
   * drawn in full and waiting for them.
   *
   * The placements rather than the bare figure, because each one carries the
   * `peak` its lines converge on — so a line ends on the top of a pole, and on
   * the top of the pole as the terrain under it actually left it.
   */
  const strung = $derived(
    poles && anchored?.length && field
      ? placeAnchors(poles, anchored, field.sampleRadius).filter((node) => node.isPlaced)
      : [],
  );

  /**
   * Built here rather than inside `Harness`, because the swarm rides the same
   * loops — a soul on a line and the line under it must be one curve.
   */
  const loops = $derived.by(() => {
    if (!harness || !strung.length) return undefined;

    const built = buildLoops(harness, strung);
    trimLoopCache();

    return built;
  });

  /**
   * The world's one clock. The body turns by it and the swarm reads it, so
   * nothing has to integrate a second copy of the same rotation.
   */
  let spinAngle = $state(0);

  useTask((delta) => {
    if (!visual.spin) return;

    spinAngle += visual.spin * delta;
    invalidate();
  });

  /**
   * The click's marks and the clock they are timed by. Not `$state`: a flash is
   * a frame's worth of geometry rather than something anything renders from, and
   * putting a ring buffer through the reactive graph would invalidate the world
   * once per mark per frame.
   */
  const pulses = createPulses();

  /**
   * `undefined` until the first read, so a view coming back into the observer's
   * range replays nothing — `PlanetView` keeps its count across the remount that
   * mounting only what is on screen costs.
   */
  let answered: number | undefined;

  $effect(() => {
    const at = flashes;

    if (answered === undefined || !pulse || !field) {
      answered = at;
      return;
    }

    // Clamped to the buffer: a burst longer than it would only overwrite its own
    // oldest marks, and every one of those is a field sample.
    for (let i = Math.max(answered, at - PULSE_CAPACITY); i < at; i++) {
      pulses.flash(Math.round(pulse.sparks), field);
    }

    answered = at;
    invalidate();
  });

  /**
   * Advanced always and asking for frames only while something is drawing, so a
   * world nobody has clicked costs the same as one that cannot be.
   */
  useTask((delta) => {
    if (!pulse) return;

    pulses.advance(delta);

    if (pulses.isLive(Math.max(pulse.haloLife, pulse.sparkLife))) {
      invalidate();
    }
  });

  $effect(() => {
    scene.background = new THREE.Color(readToken(backgroundToken, '#f4f4f2'));
    invalidate();
  });
</script>

<T.OrthographicCamera makeDefault position={[0, 0, 5]} {zoom} />

<PlanetBody {visual} {zoom} {spinAngle}>
  {#snippet standing()}
    {#if harness && loops}
      <Harness visual={harness} {loops} />
    {/if}

    {#if poles && anchored?.length && field}
      <Anchors visual={poles} {anchored} {field} {zoom} />
    {/if}

    <!-- Inside the spin, because a spark is a mark on the ground it hit. -->
    {#if pulse}
      <Sparks visual={pulse} {pulses} size={worldSize} />
    {/if}
  {/snippet}

  {#if swarm && cohorts?.length}
    <SoulSwarm
      visual={swarm}
      counts={cohorts}
      {zoom}
      {loops}
      {spinAngle}
      size={worldSize}
    />
  {/if}
</PlanetBody>

<!-- Outside the body altogether: the halo is about the world, not on it, so
     neither the tilt nor the spin may reach it. -->
{#if pulse}
  <Halo visual={pulse} {pulses} />
{/if}
