<script lang="ts">
  /**
   * The reading that locks when you leave, and the three things it could lock
   * to. Not `ExcessMeter`: that one draws a slug out of zero and a doorway of
   * gate posts, because it is answering *can I leave yet*. This one is answering
   * *as what* — the whole track is live ground and the only mark is where you
   * stand on it, so nothing here is drawn from zero.
   */
  import { Badge, Label } from '$ui';
  import { getExcess, getFirstHarvestAlignment, getUnpairedKarma } from '$lib/excess';
  import { FIRST_HARVEST_ALIGNMENT_LABELS } from '$lib/labels';
  import { resolveHarvestYields } from '$lib/planets/harvest';
  import { badgeFor, byRateOrder } from '../details/badge';
  import { f } from '$lib/utils';
  import balance from '$data/balance';
  import type { HarvestRates, Polarity, ResourceType, YieldType } from '$types';

  interface Props {
    /** Seconds of income, before the alignment routes them. */
    yields: Partial<Record<YieldType, number>>;
    /** Income at departure, live — so the three columns preview real amounts. */
    rates: HarvestRates;
  }

  let { yields, rates }: Props = $props();

  /** A pile at zero, both ways — the same span the header's meter reads on. */
  const SPAN = 1;

  const SIDES: Polarity[] = [-1, 0, 1];

  const reading = $derived(getExcess() ?? 0);
  const alignment = $derived(getFirstHarvestAlignment());

  const at = (x: number) => ((Math.max(-SPAN, Math.min(SPAN, x)) + SPAN) / (SPAN * 2)) * 100;

  const caret = $derived(at(reading));

  /** The band that locks even. Drawn, because it is what the middle word means. */
  const band = $derived(balance.excess.evenBand);

  const unpaired = $derived(getUnpairedKarma());

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
        badges: (Object.keys(paid) as ResourceType[]).sort(byRateOrder).map(badgeFor),
      };
    }),
  );

  /** How far off even, unsigned — the side is the word beside it, not a minus. */
  const offEven = $derived(Math.abs(Math.round(reading * 100)));
</script>

<div class="alignment">
  <Label text="Harvest alignment" />

  <div class="track">
    <span class="ground neg" style:right="{100 - at(-band)}%"></span>
    <span class="ground pos" style:left="{at(band)}%"></span>
    <span class="caret" style:left="{caret}%"></span>
    <span class="wall start"></span>
    <span class="wall end"></span>
  </div>

  <div class="scale">
    {#each SIDES as side (side)}
      <Label
        text={FIRST_HARVEST_ALIGNMENT_LABELS[side].replace('In the ', '')}
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
    {offEven}% off even · {f(Math.abs(unpaired))} on the
    {unpaired < 0 ? 'negative' : 'positive'} side
  </p>
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
     its true width — the word EVEN under it names that gap rather than a point.
     The reference draws one uniform hatch across the whole track; this says the
     same thing and also says which way is which. */
  .track {
    position: relative;
    height: 14px;
    margin-top: var(--sp-2);
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

  .caret {
    position: absolute;
    top: -7px;
    width: 0;
    height: 0;
    translate: -50%;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--ink-900);
  }

  .wall {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    display: block;
    background: var(--ink-900);
  }

  .wall.start { left: 0; }
  .wall.end { right: 0; }

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
</style>
