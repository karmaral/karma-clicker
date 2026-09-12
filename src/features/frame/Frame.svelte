<script lang="ts">
  /**
   * The header is a reading now, not the navigation — the tabs moved to the
   * action bar below the body. Value blocks left to right: a score, Karma, the
   * tokens, and Legacy once a run can end — Overview names itself on the navbar
   * and takes no cell.
   *
   * The division the layout rests on is **bars are quantities, the meter is
   * state**. Two lengths under Details say how big each karma pile is and which
   * is bigger; the meter beside them says how far that difference has carried
   * you and where the door is. Nothing is drawn twice — excess is read in the
   * Karma cell and nowhere else in the band.
   */
  import { Cell, ExcessMeter, HeaderBand, Label, Reading, Tooltip, Value, formatExcess, tooltip } from '$ui';
  import type { Props as TippyProps } from 'tippy.js';
  import { BuildingManager, PlanetManager, ResourceManager } from '$lib/managers';
  import { getExcess } from '$lib/excess';
  import { getKarmaIncomeByPolarity } from '$lib/income';
  import { progression } from '$lib/progression';
  import { prestige } from '$lib/prestige.svelte';
  import { nav } from '$lib/nav.svelte';
  import { EXCESS_SIDES, READING_LABELS } from '$lib/labels';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f, formatRate } from '$lib/utils';
  import { refinery } from '$lib/refinery.svelte';
  import type { ResourceType } from '$types';
  import ScoreCell from './ScoreCell.svelte';

  type HeaderScreen = 'details' | 'refinery';

  /** Score, then Karma, then the refinery reading — Overview names itself on the
      navbar now, so it takes no cell here. Refinery's `1fr` column is reserved
      from the first beat, so its cell arriving later reflows nothing beside it. */
  /** Wide enough for the figure and the two-column stack of sources beside it. */
  const SCORE_WIDTH = '275px';

  /** One figure, so it takes only what a figure needs — the slack is the refinery's. */
  const LEGACY_WIDTH = '120px';

  /**
   * Karma is the widest reading in the band — two figures, two rates and the
   * meter — so it takes a floor and then shares the slack rather than being
   * squeezed to a fixed number. Both stretch columns are `1fr` above their
   * floors, so what a wide window leaves over splits between the tokens and the
   * karma cell instead of pooling in one of them.
   *
   * The tokens' 420px is measured, not chosen: it is the width at which the
   * full ladder's late-game figures, their gaps and their grade labels stop
   * fitting on one line. Sized for the full ladder even while the upper rungs
   * are still hidden — the column is reserved so that buying a grade adds a
   * figure without reflowing the band around it.
   */
  const WIDTHS: Record<HeaderScreen, string> = {
    details: 'minmax(560px, 1fr)',
    refinery: 'minmax(420px, 1fr)',
  };

  const HEADER_SCREENS: HeaderScreen[] = ['details', 'refinery'];

  /** The third cell is the tokens or it is nothing: excess used to stand in it
      until they arrived, and it is read in the Karma cell now. */
  const isRefineryTab = $derived(progression.isRevealed('reading.tokens'));

  const visible = $derived(
    HEADER_SCREENS.filter(
      (screen) => nav.state(screen) !== 'absent' && (screen !== 'refinery' || isRefineryTab),
    ),
  );

  /**
   * Wisdom held, not this run's take — what survived is a standing reading, and
   * what the run would earn belongs to the screen that spends it. Gated on the
   * prestige screen because a legacy jumps the boot to its stored beat, so the
   * key is already live on every run after the first.
   */
  const showLegacy = $derived(progression.isRevealed('prestige.screen'));

  /** Opens under the cell and stays inside the window — Legacy is the band's
      last column, so a bottom-start sheet would hang off the right edge. `arrow`
      is not settable here: it is not in the singleton's `overrides`, so every
      tooltip in the app takes the singleton's own. */
  let legacyTooltipElem: HTMLElement | undefined = $state();
  const LEGACY_TOOLTIP: Partial<TippyProps> = {
    placement: 'bottom-end',
    delay: [300, 0],
    offset: [0, 10],
    interactive: false,
  };

  const columns = $derived(
    [SCORE_WIDTH]
      .concat(visible.map((screen) => WIDTHS[screen]))
      .concat(visible.includes('refinery') ? [] : ['minmax(0, 1fr)'])
      .concat(showLegacy ? [LEGACY_WIDTH] : [])
      .join(' '),
  );

  const experience = $derived(f(ResourceManager.getAmount('experience')));

  const negAmount = $derived(ResourceManager.getAmount('karma_negative'));
  const posAmount = $derived(ResourceManager.getAmount('karma_positive'));

  const posRed = $derived(ResourceManager.getAmount('red_positive'));
  const negRed = $derived(ResourceManager.getAmount('red_negative'));

  /**
   * One crimson figure, not two. The refinery pays both lanes the same amount on
   * every pulse, so the two piles are equal by construction and the header was
   * printing the same number twice; only an inversion can part them. So the
   * reading is what pairs — which is also the only crimson Ochre can be bought
   * with.
   */
  const matchedRed = $derived(Math.min(negRed, posRed));

  const redRate = $derived(formatRate(refinery.crimsonPerSecond));
  const yellow = $derived(ResourceManager.getAmount('yellow'));
  const blue = $derived(ResourceManager.getAmount('blue'));

  /**
   * Ever bought, not currently held: spending a pile down to nothing must not
   * take its rung off the ladder, or buying blue would delete the yellow slot
   * that paid for it and the row would reflow under the click.
   */
  const hasYellow = $derived(ResourceManager.getTotal('yellow') > 0);
  const hasBlue = $derived(ResourceManager.getTotal('blue') > 0);

  /** Cohorts and the worlds already left both keep earning, so each figure sums both. */
  const harvestRates = $derived(
    sumHarvestRates(
      PlanetManager.behind.map((id) => {
        const planet = PlanetManager.getPlanet(id);

        return { yields: planet.harvestYields, duration: planet.harvestDuration };
      }),
    ),
  );

  function harvestRateFor(...types: ResourceType[]) {
    return harvestRates
      .filter((rate) => types.includes(rate.type))
      .reduce((sum, rate) => sum + rate.perSecond, 0);
  }

  const showRates = $derived(progression.isRevealed('details.status'));
  const karmaRates = $derived(getKarmaIncomeByPolarity());

  const showWorldRates = $derived(PlanetManager.behind.length !== 0);
  /** The two payers, kept apart: souls still incarnating, and the worlds behind you. */
  const cohortRate = $derived(BuildingManager.countExperiencePerSecond());
  const worldsRate = $derived(harvestRateFor('experience'));

  /* Every rate in the band goes through `formatRate`, not `f`: each of these
     rides beside a figure that already spends the cell's width, and six digits
     and a comma is what put the positive side's rate on the meter's seam. */
  const experienceRates = $derived([
    { label: 'Worlds', value: formatRate(worldsRate), muted: !worldsRate },
    { label: 'Cohorts', value: formatRate(cohortRate), muted: !cohortRate },
  ]);
  const posKarmaRate = $derived(formatRate(karmaRates.positive));
  const negKarmaRate = $derived(formatRate(karmaRates.negative));

  const reading = $derived(getExcess());

  /**
   * Two reveals, one reading. From beat 8 it is a bare figure: how far off centre
   * the piles sit, and that is all there is to know. At beat 9 a second world
   * exists, the figure gets the scale and the door drawn on it, and the same
   * number becomes a distance from somewhere.
   */
  const showExcess = $derived(reading !== undefined && progression.isRevealed('reading.excess'));
  const showScale = $derived(showExcess && progression.isRevealed('reading.excessScale'));

  const planet = $derived(PlanetManager.getActive());

  const excessGate = $derived(planet?.data.firstHarvest.excessGate);

  function getSectionLabel(screen: HeaderScreen) {
    return screen === 'details' ? 'Karma' : 'Learning tokens';
  }
</script>

<HeaderBand {columns} compact>
  <ScoreCell
    amount={experience}
    rates={showRates 
      ? (showWorldRates ? experienceRates : [experienceRates[1]])
      : undefined}
  />

  {#each visible as screen (screen)}
    <Cell label={getSectionLabel(screen)} banded>
      <!-- The excess block's title, hoisted onto the cell's own label line and set
           as an aside: it names a block inside Karma, not a cell beside it. Once
           the scale is revealed it is width-matched to the track below, so it
           starts exactly where the track does.

           The title and nothing else: the block below prints the figure — between
           its own two end words once it is a meter — so a reading up here would
           be the same number twice in one cell. -->
      {#snippet header()}
        {#if screen === 'details' && showExcess}
          <span class={['excess-title', { tracked: showScale }]}>
            <Label text="Excess" muted />
          </span>
        {/if}
      {/snippet}

      {#if screen === 'details'}
        <!-- Bottom-aligned, so the two sides' names and the meter's own readout
             land on one caption line across the whole cell. -->
        <span class="karma">
          {#if progression.isRevealed('reading.negKarma')}
            <Reading label={READING_LABELS.karmaNegative}>
              <Value kind="neg" value={f(negAmount)} rate={showRates ? negKarmaRate : undefined} />
            </Reading>
          {/if}
          {#if progression.isRevealed('reading.posKarma')}
            <Reading label={READING_LABELS.karmaPositive}>
              <Value kind="pos" value={f(posAmount)} rate={showRates ? posKarmaRate : undefined} />
            </Reading>
          {/if}
          {#if showExcess}
            <!-- A subcell inside the cell: the two bars are Karma, and this is
                 how far off centre they leave you. Its title is up on the label
                 line either way; what changes is whether the figure has a scale
                 under it. Unsigned in both states — the side is the badge's hue
                 or the lit end word, never a minus on the number. -->
            <span class="excess">
              {#if showScale}
                <ExcessMeter value={reading} gate={excessGate} sides={EXCESS_SIDES} />
              {:else}
                <Value
                  kind={reading === 0 ? 'both' : reading > 0 ? 'pos' : 'neg'}
                  value={formatExcess(reading)}
                />
              {/if}
            </span>
          {/if}
        </span>

      {:else}
        <!-- The rungs above crimson arrive as they are bought. Crimson is the
             cell's reason to exist and the beat that reveals the cell is the
             beat that pays it, so it is unconditional; Ochre and Indigo are
             purchases, and the grade table upstairs is where you go to learn
             they exist. -->
        <span class="tokens">
          <Reading label={`matched ${READING_LABELS.red}`}>
            <Value
              kind="red-both"
              value={f(matchedRed)}
              size="lg"
              muted={!matchedRed}
              rate={showRates ? redRate : undefined}
            />
          </Reading>
          {#if hasYellow}
            <Reading label={READING_LABELS.yellow}>
              <Value kind="yellow" value={f(yellow)} size="lg" muted={!yellow} />
            </Reading>
          {/if}
          {#if hasBlue}
            <Reading label={READING_LABELS.blue}>
              <Value kind="blue" value={f(blue)} size="lg" muted={!blue} />
            </Reading>
          {/if}
        </span>
      {/if}
    </Cell>
  {/each}

  {#if showLegacy}
    <Cell
      label="Legacy"
      banded
      {@attach tooltip({ content: legacyTooltipElem, options: LEGACY_TOOLTIP })}
    >
      <Reading label={READING_LABELS.wisdom}>
        <Value kind="wisdom" value={f(prestige.held)} muted={!prestige.held} size="lg" />
      </Reading>
    </Cell>
  {/if}
</HeaderBand>

<!-- Placeholder copy — the sheet's shape, not its words yet. Rendered outside
     the band so it is never a grid item of it. -->
{#if showLegacy}
  <Tooltip bind:contentElem={legacyTooltipElem}>
    <div class="legacy-tooltip">
      <div class="title">Legacy</div>
      <p>Wisdom carried out of runs already ended. Placeholder — what it buys, and why it survived, goes here.</p>
      <p class="note">Placeholder: where this legacy came from, run by run.</p>
    </div>
  </Tooltip>
{/if}

<style>
  /* Three named columns, not a packed row. Left-packed, the four figures sat at
     intervals set by their own magnitudes — every one of them moved whenever any
     of them grew a digit, and the pair's shared badge read as just another mark
     in the run. Spreading them out alone did not fix it: the eye had no account
     of *why* a figure sat where it sat, so the width between them read as
     leftover room. Each column naming its grade is what earns the spacing, and
     it is what claims both halves of the pair as one reading.

     max-content floors rather than 0: below the column's own floor the slots
     crowd up against each other and then overflow, which is legible. Allowed to
     shrink to nothing they slide *under* one another instead, and a figure
     half-covered by the next one reads as a different number. */
  .tokens {
    display: grid;
    grid-template-columns: auto minmax(max-content, 1fr) minmax(max-content, 1fr);
    align-items: last baseline;
    gap: var(--sp-4);
    flex: 1;
    min-width: 0;
  }

  /* Aligned on the *last* baseline, not on the boxes' bottoms: the two sides and
     the meter are three different heights, and the thing that has to line up
     across them is the caption line — the sides' names and the meter's readout.
     Bottom-aligning got close and stayed a pixel or two out, because it lines up
     descenders rather than baselines; this says what is actually meant. */
  .karma {
    display: flex;
    align-items: last baseline;
    gap: var(--sp-4);
    flex: 1;
    min-width: 0;
  }

  /* A block within the cell. The two bars are quantities and this is state, so
     it takes the band's own divider rather than sitting in the row as a third
     figure — but its title went up to the cell's label line, which is what makes
     the divider read as a seam rather than as a caption's underline.

     No bottom padding and nothing pinned: the meter's readout is in flow now, so
     the row's own end-alignment is what lands it on the caption rail. It sizes to
     what is in it — 18ch of track once the scale is revealed, a figure's width
     before that — so it takes no share of the slack either way. */
  .excess {
    display: flex;
    flex-direction: column;
    flex: none;
    border-left: var(--rule-row);
    padding-left: var(--sp-4);
    margin-left: auto;
    /* What the track rests its baseline on — the size the karma figures beside
       it are set at, so the bar underlines them rather than floating. */
    --meter-figure: var(--fs-xl);
  }

  /* Matches Tooltip's own title/description register — the sheet is a snippet
     here only so the placeholder can grow a breakdown without a props rewrite. */
  .legacy-tooltip {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .legacy-tooltip .title {
    font-weight: 600;
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .legacy-tooltip p {
    margin: 0;
    font-size: var(--fs-sm);
    line-height: 1.4;
    color: var(--ink-600);
  }

  .legacy-tooltip .note {
    color: var(--ink-300);
  }

  /* Pushed to the end of the label row, where the reading it names also ends.
     Before the scale there is no track to line up with, so the box is its own
     text and the two right edges are what agree.

     With the scale, one box the width of the track, so its left edge *is* the
     track's left edge. It used to be the seam's width with the seam's padding
     added back — two numbers that had to cancel, and any mismatch between them
     came out as the title standing a gap in from the bar it names. Nothing to
     cancel now: both sides read `--meter-track` and only that. Neither box can
     see the other, so the token is the whole agreement — if this drifts again
     the fix is containment, not a second number. */
  .excess-title {
    display: flex;
    align-items: baseline;
    gap: 5px;
    margin-left: auto;
    width: fit-content;
  }

  .excess-title.tracked {
    width: var(--meter-track);
  }

</style>
