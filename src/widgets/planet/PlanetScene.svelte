<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import * as THREE from 'three';
  import Anchors from './Anchors.svelte';
  import Bolt from './Bolt.svelte';
  import Halo from './Halo.svelte';
  import Harness from './Harness.svelte';
  import PlanetBody from './PlanetBody.svelte';
  import SoulSwarm from './SoulSwarm.svelte';
  import Sparks from './Sparks.svelte';
  import { placeAnchors, type AnchorPlacement, type AnchorVisual } from './anchor';
  import { advanceClock, getClock } from './clock';
  import { createSurfaceField } from './field';
  import { buildLoops, trimLoopCache, type HarnessVisual } from './harness';
  import { readToken } from './ink';
  import { ridersOf, type SwarmVisual } from './orbit';
  import {
    createPulses, PULSE_CAPACITY, sparkWorldPosition,
    type PulseVisual, type Spot,
  } from './pulse';
  import { coreFillOf, type PlanetVisual } from './visual';

  interface Props {
    visual: PlanetVisual;
    /** World units across the viewport's short axis — the framing, not the planet. */
    frame?: number;
    /**
     * How far down the camera stands, in world units — so the world is seen
     * *above* the box's middle. A translation and not a look-at: under an
     * orthographic camera every mark keeps the direction it was drawn in, and
     * the shaders read view-space offsets from the body's centre rather than
     * screen positions, so nothing is passed a uniform for this.
     */
    offsetY?: number;
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
    /** The share of the swarm staying with the world. See `SoulSwarm`. */
    merge?: number;
    /**
     * The harvest's alignment, −1, 0 or +1 — and the one switch for the whole
     * core. Absent draws no core, holds the body's window shut and leaves the
     * arriving souls at `settleAt`, so every view that does not pass it is the
     * picture it always was. See `PlanetBody`.
     */
    alignment?: number;
    anchors?: AnchorVisual;
    /** One flag per anchor. Empty draws no harness, the way `cohorts` does. */
    anchored?: boolean[];
    /** The lines between the anchors. Absent draws poles and nothing strung. */
    harness?: HarnessVisual;
    /** How many souls the harness carries. See `SoulSwarm`. */
    riders?: number;
    /** What a click leaves behind. Absent means the world does not answer one. */
    pulse?: PulseVisual;
    /**
     * Who this world is, for the purpose of keeping time. Two views passing the
     * same key share one clock, so switching screens does not put the world back
     * to nought. Absent keeps a private one, which is what a lab wants.
     */
    clockKey?: string;
    /**
     * A running count of clicks. Every rise echoes the world once, so the
     * caller owns the event and the scene only owns what it looks like.
     */
    flashes?: number;
    /**
     * The click's own duration, in ms — 0 once a click has ramped to instant,
     * `undefined` in a lab with no building at all. The two are kept apart on
     * purpose: an instant *click* should flash the way it always did, but a
     * lab previewing the bolt's own sliders has no click to answer to and
     * should show them exactly as authored. Lifts the bolt's life to match a
     * real click's wait — a strike struck at the press and landing with the
     * payout has to fly for exactly as long as the wait between them, or it
     * either lands early and idles or is still travelling when the spark it
     * was aimed at already fell.
     */
    clickMs?: number;
    /**
     * A running count of landed yields — not clicks. Every rise sparks the
     * ground once, so the mark answers to the payout rather than to the press
     * that queued it.
     */
    yields?: number;
    /** Where the spark a `yields` rise just planted lands on screen, in px. */
    onspark?: (point: { x: number; y: number }) => void;
    /**
     * And where the anchor currently going down is, in the same px. Pushed on
     * the frame rather than read, because the world turns under it — the caller
     * keeps the last one and uses it when it has something to say there.
     * `undefined` once every anchor is in.
     */
    onplacing?: (point: { x: number; y: number } | undefined) => void;
    /**
     * The cursor's last known spot, in the same px `onspark` reports in —
     * whether that was a press or a move since. Read at the yield to decide
     * whether a strike has anywhere to start from, and read again every frame
     * the bolt is alive so its strike-end keeps following the cursor.
     */
    getPoint?: () => { x: number; y: number } | undefined;
    /**
     * Drawn, but not looked at. A screen that has been left keeps its canvas so
     * it can come back drawn, and a world nobody sees should not be asking for
     * frames — see `watched.ts`. Its clock stops with it, which `advanceClock`
     * already treats as a pause rather than a jump.
     */
    isPaused?: boolean;
  }

  let {
    visual,
    frame = 2.7,
    offsetY = 0,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    merge,
    alignment,
    anchors,
    anchored,
    harness,
    riders,
    pulse,
    clockKey,
    flashes = 0,
    clickMs,
    yields = 0,
    onspark,
    onplacing,
    getPoint,
    isPaused = false,
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
   * Where a soul that stays ends up, in body radii — 0 when there is no core, so
   * `SoulSwarm` keeps its old destination. Worked out here for the reason
   * `bleed` is: a mark standing beside the world should not read a
   * `PlanetVisual` to find out how far in the world goes.
   */
  const core = $derived(alignment !== undefined ? Math.max(0, visual.core) : 0);

  /**
   * And how much of it is there yet. The split's own share and not the swarm's
   * lagged one: the berths a soul crosses to are packed against the full radius,
   * so the drawn sphere has to reach a berth before the soul does — it leads the
   * arrival by `mergeLag` rather than trailing it, which is the side of that
   * quarter-second a soul may not be caught outside its own core on.
   *
   * A view with no split to show draws the core whole, which is every caller
   * that predates this.
   */
  const filled = $derived(core * coreFillOf(merge ?? 1, visual.coreSeed));

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
   * The bolt's actual life: the authored floor, or the click's own duration
   * whenever that is longer. A lab has no `clickMs` and keeps the floor; a
   * click still ramping up gets a flight as long as its own wait.
   */
  const boltLife = $derived(Math.max(pulse?.boltLife ?? 0, (clickMs ?? 0) / 1000));

  /**
   * How close the life sits to its own authored floor — 1 at an instant
   * click or in the lab, easing to 0 as the wait grows real. `boltTrail` and
   * `boltHold` both key off it, so the whole strike relaxes back to its old,
   * pre-flight look together rather than one half changing without the other.
   *
   * `clickMs === undefined` is a lab with no click to answer to at all, not
   * an instant one — pinned at 1 so both sliders preview exactly as authored.
   */
  const nearFloor = $derived.by(() => {
    const floor = pulse?.boltLife ?? 0;

    if (clickMs === undefined || floor <= 0) return 1;

    return Math.min(1, floor / boltLife);
  });

  /**
   * How much of the authored trail actually plays — full length near the
   * floor, easing toward the authored share once the wait is real. The head
   * effect earns its keep on a flight long enough to *be* a flight; on an
   * instant click it only made the zero duration more visible, not less, by
   * turning a flash into a comet with somewhere to travel.
   */
  const boltTrail = $derived.by(() => {
    const authored = pulse?.boltTrail ?? 1;

    return authored + nearFloor * (1 - authored);
  });

  /**
   * How much of the strike's alpha holds at full weight through its own life,
   * rather than fading the way `fadeOf` decays a halo or a spark — 0 near the
   * floor, where a hold reads as too bright against a mark that used to fade
   * across its whole 0.15 s, up to 1 once the flight is long enough that a
   * cubic decay would ghost it out by the halfway point. See `Bolt`.
   */
  const boltHold = $derived(1 - nearFloor);

  /**
   * Every anchor, placed or ghost — and the placements rather than the bare
   * figure, because each one carries the `peak` a line converges on, as the
   * terrain under it actually left it.
   *
   * `strung` is the *placed* half of it: a harness is what has been driven in,
   * so it grows anchor by anchor instead of being drawn in full and waiting.
   */
  const placements = $derived(
    poles && anchored?.length && field ? placeAnchors(poles, anchored, field.sampleRadius) : [],
  );

  const strung = $derived(placements.filter((node) => node.isPlaced));

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

  /**
   * The veil's rate, and it is a sum because `veilSpin` is a *drift over the
   * ground* rather than a rotation of its own — see `visual.ts`. Derived once so
   * the guard below and the integration read the same number: a deck at
   * `veilSpin: -spin` is a still sky over a turning world and wants no frames,
   * and one at 0 rides a turning world and does.
   */
  const veilRate = $derived(visual.spin + visual.veilSpin);

  /** Drawn *and* moving. A veil at rest is geometry, and geometry asks for no frames. */
  const isVeiling = $derived(visual.veil > 0 && Boolean(veilRate));
  const hasSwarm = $derived(Boolean(swarm && cohorts?.length));

  /** How far each layer has turned. The only parts of the clock that render. */
  let spinAngle = $state(0);
  let veilAngle = $state(0);

  useTask(() => {
    // A world that neither turns nor carries souls has no clock to keep, and one
    // nobody is looking at keeps its own where it left it.
    if (isPaused) return;
    if (!isTurning && !isVeiling && !hasSwarm) return;

    advanceClock(clock, visual.spin, veilRate);
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

  /**
   * Spots aimed at the press, one batch per flash, waiting for the payout
   * that sparks them — a queue and not a single slot, since a queued click
   * can flash again before its first payout lands. Bounded the same as the
   * ring buffers it feeds: an unanswered flash falls off the front rather
   * than growing this forever.
   */
  let waiting: Spot[][] = [];

  $effect(() => {
    const at = flashes;

    if (answered === undefined || !pulse) {
      answered = at;
      return;
    }

    // Clamped to the buffer: a burst longer than it would only overwrite its own
    // oldest marks.
    for (let i = Math.max(answered, at - PULSE_CAPACITY); i < at; i++) {
      pulses.echo();

      if (!field) continue;

      // Untracked for the reason the payout side already reads this way: the
      // hold and the roll answer to the world at the moment of the press, not
      // to whatever frame the effect happens to flush on.
      const { held, share, standing, anchoring } = untrack(() => ({
        held: { lean: visual.lean, tilt: visual.tilt, turn: visual.turn, spin: spinAngle },
        share: ridden,
        standing: strung,
        anchoring: placements[placing],
      }));

      const from = getCursorWorld();
      if (!from || !pulse.boltWidth) continue;

      if (anchoring) {
        // The press pays the harness here, not a soul — the strike goes where
        // the press pays, and nothing is queued for a payout that never comes.
        pulses.bolt(from, { x: anchoring.x, y: anchoring.y, z: anchoring.z, r: anchoring.peak });
        continue;
      }

      // Aimed now, before the spark it is aimed at exists — see `Bolt`'s own
      // doc for why the target has to be frozen at the press. One bolt per
      // spot, so a flash that will land three sparks reads as three strikes.
      const spots = pulses.aim(
        Math.round(pulse.sparks),
        field,
        pulse.sparkFace,
        held,
        () => spotOnAnchor(standing, share),
      );

      for (const spot of spots) {
        pulses.bolt(from, spot);
      }

      waiting.push(spots);
      if (waiting.length > PULSE_CAPACITY) waiting.shift();
    }

    answered = at;
    invalidate();
  });

  /**
   * Where world (x, y) lands on screen, in px from the top-left of the canvas.
   * The camera stands unrotated on the Z axis, so this is the whole of the
   * orthographic projection — no perspective divide, and `z` never mattered.
   */
  function projectToScreen(x: number, y: number) {
    return {
      x: size.current.width / 2 + x * zoom,
      y: size.current.height / 2 - (y - offsetY) * zoom,
    };
  }

  /** The inverse of `projectToScreen` — screen px back to world (x, y). */
  function unprojectFromScreen(point: { x: number; y: number }) {
    return {
      x: (point.x - size.current.width / 2) / zoom,
      y: (size.current.height / 2 - point.y) / zoom + offsetY,
    };
  }

  /**
   * The cursor, in world xy, read fresh — the bolt's own live end. `undefined`
   * off the canvas or before there is a zoom to unproject through, which the
   * mark's own frozen spawn point stands in for.
   */
  function getCursorWorld() {
    const point = getPoint?.();

    return point && zoom > 0 ? unprojectFromScreen(point) : undefined;
  }

  /**
   * How much of the swarm the harness is carrying — and by the same number, how
   * often a strike lands on a pole instead of on open ground. A yield paid by
   * souls riding the lines should be seen to arrive there.
   *
   * `ridersOf` is the count `SoulSwarm` actually draws riding, so the two can't
   * disagree; a world with nothing strung carries nobody and takes no strikes.
   */
  const ridden = $derived.by(() => {
    if (!swarm || !cohorts?.length || !loops || !strung.length) return 0;

    const souls = cohorts.reduce((sum, count) => sum + count, 0);

    return souls > 0 ? ridersOf(swarm, souls, riders) / souls : 0;
  });

  /**
   * One roll, and the pole it picked — **any** placed one, front or back. It
   * loses at `1 - share` and at nothing else.
   *
   * `sparkFace` does not reach this. That cutoff is where a *random* mark may
   * land, and its argument is that the ground turns edge-on at the limb, so a
   * flat dot lying in it foreshortens into the outline. A pole is not a place
   * the roll found: it is a named thing on the world, and one behind it is still
   * that thing. `sparkBack` already says how loud the far side is, and the
   * strike crossing the body is the world being wrapped rather than a mark
   * misplaced.
   */
  function spotOnAnchor(standing: AnchorPlacement[], share: number): Spot | undefined {
    if (!standing.length || Math.random() >= share) return undefined;

    // The base, where the solid meets the ground — a spark is a mark on the
    // surface a strike hit. The tip is where the harness ties instead, and up
    // there the mark was lost in the cap, the lines and the bolt's own terminus.
    const at = standing[Math.floor(Math.random() * standing.length)];

    return { x: at.x, y: at.y, z: at.z, r: at.base };
  }

  /** Same cursor discipline as `flashes`, kept apart because a yield is not a click. */
  let sparked: number | undefined;

  $effect(() => {
    const at = yields;

    if (sparked === undefined || !pulse || !field) {
      sparked = at;
      return;
    }

    for (let i = Math.max(sparked, at - PULSE_CAPACITY); i < at; i++) {
      // Untracked for the same reason the press side reads it this way: where
      // the world is held is read *at* the yield, not answered to on every
      // frame the spin advances.
      const { held, share, standing } = untrack(() => ({
        held: { lean: visual.lean, tilt: visual.tilt, turn: visual.turn, spin: spinAngle },
        share: ridden,
        standing: strung,
      }));

      // The spots the matching flash already aimed the bolt at — the payout
      // lands exactly where the strike was struck toward. Falls back to a
      // fresh aim for a payout with nothing queued (a free grant, or a lab
      // driving `yields` on its own), so that path still lands somewhere.
      const spots = waiting.shift() ?? pulses.aim(
        Math.round(pulse.sparks),
        field,
        pulse.sparkFace,
        held,
        () => spotOnAnchor(standing, share),
      );

      const written = pulses.spark(spots);

      // No spark to land on (the count slider at 0) reads as the planet's own
      // centre — rotating the origin leaves it the origin.
      const world = written.length > 0 ? sparkWorldPosition(written[0], held) : { x: 0, y: 0 };

      onspark?.(projectToScreen(world.x, world.y));
    }

    sparked = at;
    invalidate();
  });

  /**
   * The one going down: they fill in order, so it is the first ghost. −1 once
   * the harness is complete, which is what puts the readout away.
   */
  const placing = $derived(placements.findIndex((node) => !node.isPlaced));

  /**
   * Reported per frame rather than on demand, because the world turns under it
   * and a caller outside the canvas has no way to ask. Cheap — one rotation and
   * a projection, and only on a world that is being anchored at all.
   */
  useTask(() => {
    if (!onplacing) return;

    const node = placements[placing];
    if (!node) {
      onplacing(undefined);
      return;
    }

    const world = sparkWorldPosition(
      { x: node.x, y: node.y, z: node.z, r: node.peak },
      { lean: visual.lean, tilt: visual.tilt, turn: visual.turn, spin: spinAngle },
    );

    onplacing(projectToScreen(world.x, world.y));
  });

  /**
   * Advanced always and asking for frames only while something is drawing, so a
   * world nobody has clicked costs the same as one that cannot be.
   */
  useTask((delta) => {
    if (isPaused || !pulse) return;

    pulses.advance(delta);

    if (pulses.isLive(Math.max(pulse.burstLife, pulse.haloLife, pulse.sparkLife, boltLife))) {
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

<T.OrthographicCamera makeDefault position={[0, offsetY, 5]} {zoom} />

<PlanetBody {visual} {zoom} {spinAngle} {veilAngle} {alignment} core={filled} {pulse} {pulses}>
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
      {riders}
      {clock}
      {spinAngle}
      {bleed}
      {merge}
      {core}
      {filled}
      lean={alignment ?? 0}
      size={worldSize}
    />
  {/if}
</PlanetBody>

<!-- Outside the body altogether: the halo is about the world, not on it, so
     neither how it is held nor the spin may reach it. -->
{#if pulse}
  <Halo visual={pulse} {pulses} />
  <Bolt
    visual={pulse}
    {pulses}
    {zoom}
    life={boltLife}
    trail={boltTrail}
    hold={boltHold}
    isInstant={(clickMs ?? 0) <= 0}
    getCursor={getCursorWorld}
    lean={visual.lean}
    tilt={visual.tilt}
    turn={visual.turn}
    {spinAngle}
  />
{/if}
