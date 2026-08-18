<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import * as THREE from 'three';
  import Anchors from './Anchors.svelte';
  import Halo from './Halo.svelte';
  import Harness from './Harness.svelte';
  import PlanetBody from './PlanetBody.svelte';
  import SoulSwarm from './SoulSwarm.svelte';
  import Sparks from './Sparks.svelte';
  import { placeAnchors, type AnchorVisual } from './anchor';
  import { advanceClock, getClock } from './clock';
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
    /**
     * `null` leaves the canvas clear, which is what a picture that will be drawn
     * onto some other ground needs: a row highlights by changing what is under
     * it, and a baked-in ground would show as a square of the wrong tone.
     */
    backgroundToken?: string | null;
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
     * Who this world is, for the purpose of keeping time. Two views passing the
     * same key share one clock, so switching screens does not put the world back
     * to nought. Absent keeps a private one, which is what a lab wants.
     */
    clockKey?: string;
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
    clockKey,
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
   * How far the body's own outline bleeds past its surface, in body radii. It is
   * authored in px, so it is only a radius once there is a zoom — and it is the
   * whole of the difference between where the world is modelled and where it is
   * seen to end. Worked out here because the *body's* outline decides it: a mark
   * standing beside the world should not read a `PlanetVisual` to find out where
   * the world stops.
   */
  const bleed = $derived(zoom > 0 ? Math.max(0, visual.outline) / zoom : 0);

  /** And that end itself. Both halves of the harness's ink rule cut here. */
  const rim = $derived(1 + bleed);

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
   * The world's one clock, now actually one: the body turns by its angle and the
   * swarm drifts by its elapsed, and neither integrates a copy. Keyed, it
   * outlives the component — so a world does not start over when a screen it was
   * on is left.
   */
  const clock = $derived(getClock(clockKey));

  const isTurning = $derived(Boolean(visual.spin));
  /** Drawn *and* moving. A veil at rest is geometry, and geometry asks for no frames. */
  const isVeiling = $derived(visual.veil > 0 && Boolean(visual.veilSpin));
  const hasSwarm = $derived(Boolean(swarm && cohorts?.length));

  /** How far each layer has turned. The only parts of the clock that render. */
  let spinAngle = $state(0);
  let veilAngle = $state(0);

  useTask(() => {
    // A world that neither turns nor carries souls has no clock to keep.
    if (!isTurning && !isVeiling && !hasSwarm) return;

    advanceClock(clock, visual.spin, visual.veilSpin);
    spinAngle = clock.angle;
    veilAngle = clock.veilAngle;

    if (isTurning || isVeiling) invalidate();
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
      // Untracked: where the world is held is read *at* the click and is not
      // something this effect answers to. Subscribing would re-run it on every
      // frame the spin advances and on every drag of the hold's puck.
      const held = untrack(() => ({
        lean: visual.lean,
        tilt: visual.tilt,
        turn: visual.turn,
        spin: spinAngle,
      }));

      pulses.flash(Math.round(pulse.sparks), field, pulse.sparkFace, held);
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

    if (pulses.isLive(Math.max(pulse.burstLife, pulse.haloLife, pulse.sparkLife))) {
      invalidate();
    }
  });

  $effect(() => {
    scene.background = backgroundToken === null
      ? null
      : new THREE.Color(readToken(backgroundToken, '#f4f4f2'));
    invalidate();
  });
</script>

<T.OrthographicCamera makeDefault position={[0, 0, 5]} {zoom} />

<PlanetBody {visual} {zoom} {spinAngle} {veilAngle} {pulse} {pulses}>
  {#snippet standing()}
    {#if harness && loops}
      <Harness visual={harness} {loops} {zoom} {rim} size={worldSize} />
    {/if}

    {#if poles && anchored?.length && field}
      <Anchors visual={poles} {anchored} {field} {zoom} size={worldSize} />
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
      {clock}
      {spinAngle}
      {bleed}
      size={worldSize}
    />
  {/if}
</PlanetBody>

<!-- Outside the body altogether: the halo is about the world, not on it, so
     neither how it is held nor the spin may reach it. -->
{#if pulse}
  <Halo visual={pulse} {pulses} />
{/if}
