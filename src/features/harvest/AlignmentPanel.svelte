<script lang="ts">
  /**
   * The reading that locks when you leave, and the three things it could lock
   * to. Not `ExcessMeter`: that one draws a slug out of zero, because it is
   * answering *can I leave yet* from anywhere in ±100%. This one is answering
   * *as what* — the whole track is live ground and the only mark is where you
   * stand on it, so nothing here is drawn from zero.
   *
   * Which is why the two do **not** share a scale. That one bows a ±100% track
   * so a gate a few percent wide is visible from across it; this one is never
   * seen except from inside that gate, so it *is* the gate — the doorway plus a
   * small shoulder, end to end, and linear, because at that span the distances
   * are legible as themselves and a bow would only spend the track on even.
   */
  import { Badge, Label, createPixelGrid, formatExcess } from '$ui';
  import { getExcess, getFirstHarvestAlignment, getUnpairedKarma } from '$lib/excess';
  import { FIRST_HARVEST_ALIGNMENT_LABELS, getDemandLabel } from '$lib/labels';
  import { resolveHarvestYields } from '$lib/planets/harvest';
  import { badgeFor, byRateOrder } from '../details/badge';
  import { f } from '$lib/utils';
  import balance from '$data/balance';
  import type Planet from '$lib/planets/base.svelte';
  import type { HarvestRates, Polarity, ResourceType, YieldType } from '$types';

  interface Props {
    /** The world being left, for its declared yields and what its demand settled at. */
    planet: Planet;
    /** Income at departure, live — so the three columns preview real amounts. */
    rates: HarvestRates;
  }

  let { planet, rates }: Props = $props();

  /** Seconds of income, before the alignment routes them. */
  const yields = $derived(planet.data.harvest?.yields ?? {});

  const SIDES: Polarity[] = [-1, 0, 1];

  const reading = $derived(getExcess() ?? 0);
  const alignment = $derived(getFirstHarvestAlignment());

  /**
   * The band that locks even. Drawn, because it is what the middle word means:
   * the word EVEN names that gap rather than a point.
   */
  const band = $derived(balance.excess.evenBand);

  /** The doorway this world asks you to stand in. */
  const gate = $derived(planet.data.firstHarvest.excessGate);

  /**
   * How much wall is drawn either side of the door, as a share of it. Small on
   * purpose: the shoulder is there so the posts read as posts rather than as the
   * ends of the world, and so a reading that lapses past the gate has somewhere
   * to be seen doing it — past this it pins to the wall, which is honest, since
   * one step outside and a hundred both mean the door is shut.
   */
  const MARGIN = 0.2;

  /**
   * Both landmarks fit, whichever is wider. The gate is on every authored world
   * and is always the outer one — but it tightens world over world (0.12 down to
   * 0.03) while the band stays flat, so `max` is what keeps the even door on the
   * track if a world ever authors a gate inside it, and what gives an
   * unrestricted world a scale at all.
   */
  const span = $derived(Math.max(gate ?? 0, band) * (1 + MARGIN));

  /** Linear, and clamped: the track is the doorway, so its ends are the ends. */
  const at = (x: number) => ((Math.max(-span, Math.min(span, x)) + span) / (span * 2)) * 100;

  /**
   * The device pixel grid the track stands on — see `createPixelGrid`. Every
   * mark goes through `mark`, so none of them disagree, and none of them smear.
   */
  const grid = createPixelGrid();

  const mark = (x: number) => grid.snap((at(x) / 100) * grid.width);

  const caret = $derived(mark(reading));

  /** Karma lands half in each pile, so the pair is one matched badge, not two. */
  function badgesOf(paid: Partial<Record<ResourceType, number>>) {
    const types = (Object.keys(paid) as YieldType[])
      .filter((type) => type !== 'karma_negative')
      .map((type) => (type === 'karma_positive' ? 'karma' : type));

    return types.sort(byRateOrder).map(badgeFor);
  }

  /**
   * What each side would pay, as the multiplier on experience and the karma it
   * places. Read off `resolveHarvestYields` rather than restated, so the three
   * columns cannot drift from what taking the harvest actually does.
   */
  const sides = $derived(
    SIDES.map((polarity) => {
      const paid = resolveHarvestYields(yields, polarity, rates);
      const declared = (yields.experience ?? 0) * (rates.experience ?? 0);
      const experience = paid.experience ?? 0;

      return {
        polarity,
        // Two places, or a bonus that divides badly prints its whole tail.
        multiplier: declared > 0 ? Math.round((experience / declared) * 100) / 100 : 1,
        badges: badgesOf(paid),
      };
    }),
  );

  /** The scale's own words, less the phrase that only reads as a lock. */
  const wordFor = (side: Polarity) => FIRST_HARVEST_ALIGNMENT_LABELS[side].replace('In the ', '');

  /**
   * The amount behind the caret's percentage, and which way it leans — in the
   * karma columns' words, the same ones the scale draws, never the excess sides
   * (see `labels.ts`). Keyed off the raw sign, not `alignment`: the lit word
   * already says what locks, and this says where the karma actually sits —
   * inside the even band it still sits on one side.
   */
  const unpaired = $derived(getUnpairedKarma());

  const lean = $derived(
    unpaired === 0 ? 'into neither side' : `into the ${wordFor(Math.sign(unpaired) as Polarity)}`,
  );

  /**
   * What the world takes off you while you stay. Its own line and not part of
   * the track: the track is the reading the door takes, and this is a pull on
   * one pile that moves it.
   */
  const wants = $derived(getDemandLabel(planet.demand));
  const pullPercent = $derived(Math.round(planet.pullShare * 100));
</script>

<div class="alignment">
  <Label text="Harvest alignment" />

  <!-- Nothing is drawn until the box has been measured: every mark is a pixel
       offset into it, and at a width of nought they would all stack on the left
       edge for one frame. -->
  <div class="track" {@attach grid.measure} style:--hair="{grid.hair}px">
    {#if grid.width > 0}
      <span class="ground neg" style:right="{grid.width - mark(-band)}px"></span>
      <span class="ground pos" style:left="{mark(band)}px"></span>

      <!-- What the span is measured from, so the ends stop being arbitrary. Above
           the bar, not on it: both grounds are hatched at all times here, so a
           mark inside the track would be legible only in the even gap. -->
      {#if gate !== undefined}
        <span class="fork" style:left="{mark(-gate)}px" style:right="{grid.width - mark(gate)}px"></span>

        <!-- Named where it is drawn, over its own doorway — the same place the
             header's meter names it, and the line under the track belongs to the
             reading now. Centred on the track because the fork is symmetric about
             zero, so the track's middle is the fork's middle. -->
        <span class="gate-tag">
          <Label text="Gate" size="caption" classValue="tag" />
          <span class="num">±{Math.round(gate * 100)}%</span>
        </span>
      {/if}

      <!-- Dead centre: perfect balance, and what the whole reading is measured
           from. Grey and inside the bar — it is the ground the needle is read
           against, not a second reading, and the walls either end are already the
           track's black marks. -->
      <span class="zero" style:left="{mark(0)}px"></span>

      <!-- Re-keyed on the measurement, not on the reading — see `grid.generation`
           and the transition below. -->
      {#key grid.generation}
        <span class="needle" style:left="{caret}px"></span>
        <span class="caret" style:left="{caret}px"></span>
      {/key}

      <span class="wall start"></span>
      <span class="wall end"></span>
    {/if}
  </div>

  <!-- The reading rides its own mark: the figure is what the caret's position
       means, so it travels with it rather than being recited in a sentence
       further down. Unsigned — which side is the lit word below and the caret's
       own side of centre, so a minus would be the third telling. -->
  <div class="readout">
    {#key grid.generation}
      <span class="value" style:left="{caret}px">{formatExcess(reading)}</span>
    {/key}
  </div>

  <div class="scale">
    {#each SIDES as side (side)}
      <Label
        text={wordFor(side)}
        size="sm"
        tone={side === alignment ? 'active' : 'inactive'}
      />
    {/each}
  </div>

  <div class="pays">
    {#each sides as side (side.polarity)}
      <span class={['pay', { locked: side.polarity === alignment }]}>
        <span class="num">{side.multiplier}×</span>
        {#each side.badges as kind, i (i)}
          <Badge {kind} />
        {/each}
      </span>
    {/each}
  </div>

  <p class="note">
    {f(Math.abs(unpaired))} {lean}
  </p>

  {#if wants}
    <p class="note demand">
      Takes {wants} · <span class="num">{pullPercent}%</span> a phase ·
      <span class="rate">
        {#if planet.pulledPole}<span class="badge"><Badge kind={badgeFor(planet.pulledPole)} /></span>{/if}
        <span><span class="num">{f(planet.pullPerSecond)}</span>/s</span>
      </span>
    </p>
  {/if}
</div>

<style>
  .alignment {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
    background: var(--surface);
    border: var(--rule-card);
    min-width: 0;
  }

  /* Not one ground but three, and the plain gap in the middle is `evenBand` at
     its true width — which is a width worth drawing now that the track spans the
     gate rather than ±100%: a quarter of the door on the first world, over half
     of it on the last. The reference draws one uniform hatch across the whole
     track; this says the same thing and also says which way is which.

     The margin is everything that stacks over the bar — caret, then the gate's
     lintel, then the tag naming it — so the label above clears the whole pile
     rather than just the nearest mark. */
  .track {
    position: relative;
    height: 14px;
    margin-top: var(--sp-5);
    background: var(--line-100);
  }

  .ground {
    position: absolute;
    top: 0;
    bottom: 0;
    display: block;
  }

  .ground.neg { left: 0; background: var(--hatch-neg-bar); }

  .ground.pos {
    right: 0;
    background: var(--hatch-pos-bar);
    box-shadow: var(--hatch-pos-edge);
  }

  /* Left edge on the mark, not centred on it: a 1px box shifted by half its own
     width is exactly the half-pixel smear the snapping is there to avoid. The
     needle below takes the same convention, so the two agree — they are drawn
     from one `mark`, and at a dead-even reading the needle covers this line. */
  .zero {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--hair);
    display: block;
    background: var(--ink-300);
  }

  /* Above the fork, centred on the track — the fork's own middle, since it is
     symmetric about zero. Its own caption size and line-height, so it sits on
     the mark it belongs to rather than floating on an inherited strut. */
  .gate-tag {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 14px);
    translate: -50% 0;
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: var(--fs-caption);
    line-height: 1;
    white-space: nowrap;
  }

  /* The gate recedes: it is the condition, not the reading. */
  .gate-tag .num {
    font-weight: 600;
    color: var(--ink-200);
  }

  /* A doorway the caret stands inside: the legs come down to the bar and the
     lintel passes over the caret's head, so the reading is enclosed by the thing
     it has to stay within rather than sitting beside it. Grey, and behind the
     caret's black where the two meet — the gate is the condition, not the
     reading, and a caret on a post should read as touching it. */
  .fork {
    position: absolute;
    top: -12px;
    height: 11px;
    display: block;
    box-sizing: border-box;
    border: var(--hair) solid var(--ink-300);
    border-bottom: 0;
  }

  /* Half a hairline right of the mark, because the needle is drawn *from* the
     mark rather than centred on it — so the apex lands over the needle's middle
     instead of its left edge. Half a pixel at 100%, which is exactly how far
     the head used to lean. */
  .caret {
    position: absolute;
    top: -7px;
    width: 0;
    height: 0;
    translate: calc(-50% + var(--hair) / 2);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--ink-900);
  }

  /* The needle: the head says roughly, this says exactly. Its own box stretched
     to the track rather than a stem hung off the caret — the head is a
     borders-only triangle whose padding box collapses onto its tip, so a stem
     drawn inside it would carry the track's height as a second hardcoded number.
     Both read the one `caret`, so there is nothing to keep in step.

     Haloed in the panel's own ground because it crosses both hatches: near-black
     on one side of even and white on the other, so no single ink reads on both,
     and the core needs a gap around it to stay a line rather than joining the
     weave. The head sits clear of the track and needs none. */
  .needle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--hair);
    display: block;
    background: var(--ink-900);
    box-shadow: 0 0 0 var(--hair) var(--surface);
  }

  /* The travel belongs to the reading alone. A freshly inserted element does not
     transition, so the `{#key grid.generation}` above is what keeps a re-measure
     — the takeover widening the body under this panel as it opens, a window
     resize, a move between screens — from reading as the caret sliding in from
     a position it was never read at. */
  .caret,
  .needle,
  .readout .value {
    transition: left .3s;
  }

  /* The ends are the track's own edges, so they sit wherever its box does — but
     in whole device pixels like every other mark, or the two posts holding the
     scale would be the softest things on it. */
  .wall {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: calc(var(--hair) * 2);
    display: block;
    background: var(--ink-900);
  }

  .wall.start { left: 0; }
  .wall.end { right: 0; }

  /* One line's room under the bar for a figure that has no column to sit in.
     The panel's own gap would leave it floating midway between the track and the
     words, belonging to neither, so this seam alone is pulled tight — the same
     single-seam override `.note.demand` makes below. */
  .readout {
    position: relative;
    margin-top: calc(var(--sp-1) * -1);
    height: var(--fs-sm);
    font-size: var(--fs-sm);
    line-height: 1;
  }

  /* Centred on the caret, and allowed to overhang: at either wall half the
     figure falls into the panel's own side padding, which is wider than the
     overhang — so it stays inside the card without a clamp that would drift the
     figure off the mark it is naming. */
  .readout .value {
    position: absolute;
    top: 0;
    translate: -50%;
    font-weight: 600;
    color: var(--ink-900);
    white-space: nowrap;
  }

  .scale,
  .pays {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-2);
  }

  /* First left, last right — the three read as the track under them. */
  .scale > :global(*:nth-child(2)) { justify-self: center; }
  .scale > :global(*:nth-child(3)) { justify-self: end; }

  .pay {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .pay:nth-child(2) { justify-content: center; }
  .pay:nth-child(3) { justify-content: flex-end; }

  /* The one you would actually lock. The other two are what you gave up. */
  .pay.locked { color: var(--ink-900); }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  /* The multiplier alone comes forward — the sentence around it is context and
     the figure is the thing the stay actually bought. */
  .note.demand {
    margin-top: calc(var(--sp-1) * -1);
  }

  /* The pile it drains, badged on the figure so the rate names its own pole. */
  /* `RateFigure`'s arrangement: the figure's baseline is the row's, and the badge
     centres out of the group — `vertical-align: middle` centred it on the
     x-height, which sits under the digits' middle. */
  .note.demand .rate {
    display: inline-flex;
    align-items: baseline;
    gap: var(--badge-gap);
  }

  .note.demand .badge {
    display: flex;
    align-self: center;
  }

  .note.demand .num {
    color: var(--ink-900);
    font-weight: 600;
  }
</style>
