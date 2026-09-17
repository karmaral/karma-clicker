<script module lang="ts">
  import { TooltipManager } from '$lib/managers';
  import { extended } from './extended.svelte';

  /**
   * The derivation is a read, not a hover: it opens while the right button is
   * down over a row and closes when it comes up. The hold is one flag for the
   * whole table — see `extended`, which is that flag and the register the table
   * reads in while it is down.
   */

  /** Right. `MouseEvent.button`, not the `buttons` mask. */
  const RIGHT = 2;

  /**
   * Only the button that opened it may close it. A left click while the panel
   * is up is a buy or a send, and the panel is the thing that just said what it
   * would do — it has no business going down for the click it argued for.
   */
  function endHold(event: MouseEvent) {
    if (event.button !== RIGHT) return;

    window.removeEventListener('mouseup', endHold);
    extended.close();
    TooltipManager.hide();
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { Props as TippyProps } from 'tippy.js';
  import { PurchaseButton, Tooltip, tooltip } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { clock } from '$lib/clock';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f, formatCost, formatSpan, roman } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { PurchaseMode } from './types';
  import CohortTooltip from './CohortTooltip.svelte';
  import SoulCount from './SoulCount.svelte';
  import { badgeFor } from './badge';
  import { lifeLabel } from './derivation';
  import { getDock } from '$lib/dock';
  import { resolvePurchasable, resolveQuantity } from './purchase';
  import texts from '$data/buildings-texts';

  interface Props {
    cohort: Building;
    purchaseMode?: PurchaseMode;
    compact?: boolean;
    /** The head prices the same buy this row is previewing. Undefined clears it. */
    onpreview?: (id: string | undefined) => void;
    onpurchase?: (quantity: number) => void;
    /** A tapped right button on the buy cell advances the mode, without leaving the row. */
    oncyclemode?: () => void;
  }

  let {
    cohort,
    purchaseMode = '1',
    compact = true,
    onpreview,
    onpurchase,
    oncyclemode,
  }: Props = $props();

  const resolvedQuantity = $derived(resolveQuantity(cohort, purchaseMode));
  const quantity = $derived(resolvePurchasable(cohort, purchaseMode));
  const cost = $derived(cohort.getCost(quantity) ?? 0);
  const affordable = $derived(resolvedQuantity > 0 && BuildingManager.canAfford(cohort.id, resolvedQuantity));

  /**
   * A cohort starts manual — see `docs/design.md` §5, *Clerks*. The send verb
   * is what a row has instead of a clock until its clerk is bought, and the
   * whole row is the send target — only the purchase cell opts back out.
   */
  const canSend = $derived(!cohort.isAutonomous && cohort.count > 0);

  function send() {
    if (cohort.isInProgress) return;

    cohort.queueAction();
  }

  /** The purchase cell is its own control — a click there must not also send. */
  function onRowClick(e: MouseEvent) {
    if (!canSend) return;
    if ((e.target as HTMLElement).closest('.purchase-container')) return;

    send();
  }

  function onRowKeydown(e: KeyboardEvent) {
    if (!canSend || (e.key !== 'Enter' && e.key !== ' ')) return;

    e.preventDefault();
    send();
  }

  /** Lit while an upgrade that would change this cohort is being hovered. */
  const isLit = $derived(spotlight.isLit('cohort', cohort.id));

  /**
   * And pointed the other way, on the row's own hover: the planet draws this
   * cohort's orbit. Through `spotlight` rather than a prop because the two ends
   * are the table and a canvas four components down — the case the channel is
   * for — and because the row then tints itself through the same reading an
   * upgrade's hover gives it, instead of by a second rule in CSS.
   *
   * The bucket key `parseScope` already reads, so nothing new is being spoken.
   */
  function pointAtBand() {
    spotlight.point(`cohort:${cohort.id}`);
  }

  function startPreview() {
    onpreview?.(cohort.id);
  }

  function endPreview() {
    onpreview?.(undefined);
  }

  let tooltipElem: HTMLElement | undefined = $state();

  const HIDE_MS = 80;

  /**
   * How far right there is to go — the rail, which is the last thing before the
   * card's edge. Absent on the preview page and before the rail lands, which
   * fall back to a fixed width instead.
   */
  const dock = getDock();
  const docked = $derived(dock?.box);

  let rowElem: HTMLElement | undefined = $state();

  /**
   * The row is the bar. A life in flight is a wash crossing the row rather than
   * a rule under the name — the same reading the stream already had at row
   * scale, and the width that used to be spent on a track is now the countdown.
   *
   * It is a box of its own and not the row's `background-image`, so the run it
   * covers is *laid out* — the buy cell's own width sets where it stops, and
   * nothing has to be measured or masked. A mask was the earlier shape and it
   * cost the row its hover: an opaque plate over the ident is opaque over the
   * tint too.
   *
   * The fill slides rather than scales — a scaled box takes its gradient with
   * it, and the falloff at the leading edge would have widened as it went. It
   * is a transform either way, which is the one thing that must not be a
   * `width`: see `SweepBar`, which had the same problem.
   */
  let fillElem: HTMLElement | undefined = $state();
  let sweep: Animation | undefined;

  $effect(() => {
    // A stream has no landing to fill to: the band below is its whole clock.
    if (cohort.isStreaming) return;

    /**
     * From wherever the life already stands to full. A re-armed wait — an
     * upgrade shortening the clock mid-life — keeps the share it has served.
     */
    const draw = (duration: number, remaining: number) => {
      sweep?.cancel();
      if (!fillElem || !duration || remaining <= 0) return;

      const from = Math.max(0, Math.min(1, 1 - remaining / duration));

      sweep = fillElem.animate(
        [
          { transform: `translateX(${(from - 1) * 100}%)` },
          { transform: 'translateX(0)' },
        ],
        { duration: remaining, easing: 'linear' },
      );
    };

    // A `halt` arrives with no detail, so it reads as a wait of no length and
    // takes the wash down rather than letting it run on to a landing.
    const queued = (detail?: Record<string, unknown>) => {
      const duration = Number(detail?.duration ?? 0);

      draw(duration, Number(detail?.remaining ?? duration));
    };

    // Mounted mid-life — a screen kept alive off-camera resumes to a clock
    // already running, and the next `queue` may be a whole life away. Untracked,
    // or every queue would re-run this effect and resubscribe with it.
    untrack(() => {
      if (cohort.isInProgress) draw(cohort.duration, cohort.nextAt - clock.now());
    });

    BuildingManager.addListener(cohort.id, 'queue', queued);
    BuildingManager.addListener(cohort.id, 'halt', queued);

    return () => {
      sweep?.cancel();
      BuildingManager.removeListener(cohort.id, 'queue', queued);
      BuildingManager.removeListener(cohort.id, 'halt', queued);
    };
  });

  /** The countdown wants a clock of its own — `nextAt` alone never re-reads. */
  let now = $state(clock.now());

  $effect(() => {
    if (!cohort.isInProgress || cohort.isStreaming) return;

    now = clock.now();
    const id = setInterval(() => { now = clock.now(); }, 100);

    return () => clearInterval(id);
  });

  const remaining = $derived(Math.max(0, cohort.nextAt - now));

  /** A tenth while the landing is close enough to watch, whole units once it is not. */
  const remainingLabel = $derived(
    remaining >= 10_000 ? formatSpan(remaining) : `${(remaining / 1000).toFixed(1)}s`,
  );

  /** 380 was never real: `Tooltip` clamps to `--tooltip-max`, which defaults to 320. */
  const BESIDE_WIDTH = 380;

  /** The one gap between the row and its panel, and where the arrow lives. */
  const ROW_GAP = 8;

  /**
   * How far the arrow hangs past the box it is pinned to — `Tooltip` sets it
   * `bottom: -5px`. Beside the row that reach ran alongside the gap and cost it
   * nothing; above the row it eats it, so the distance has to carry both.
   */
  const ARROW_REACH = 5;

  /**
   * How far the buy cell bleeds up past the row's own top edge — the negative
   * `margin-block` on `.purchase-container` below, compact. The panel is pinned
   * to the row but the button is the topmost thing in it, so the gap you see is
   * measured from the button and the distance has to clear the bleed first.
   */
  const PURCHASE_BLEED = 11;

  const PANEL_OFFSET = ROW_GAP + ARROW_REACH + PURCHASE_BLEED;

  const TOOLTIP_PANEL_EXTRA = 32;

  /**
   * Everything from the row's right edge to the rail's: the screens' own gutter,
   * then the whole rail. The gutter is measured off the two edges rather than
   * read back from a token, so the only things that have to agree are where the
   * boxes actually are — and the rail's published width is what makes the figure
   * recompute when the window resizes.
   *
   * ⚠ The panel opens *above* the row now and no longer runs into the rail, so
   * this is a width and not a fit. Kept as it was because it is the width the
   * derivation was laid out to read at — narrowing it to the row would rewrap
   * every line in the panel.
   */
  const panelWidth = $derived.by(() => {
    if (!docked || !rowElem) return BESIDE_WIDTH;

    const gutter = docked.getBoundingClientRect().left - rowElem.getBoundingClientRect().right;

    return gutter + dock!.width - ROW_GAP + TOOLTIP_PANEL_EXTRA;
  });

  /**
   * A hover is never enough. The singleton listens on hover for every tooltip
   * in the app and cannot be told otherwise per reference, so the row refuses
   * the show it is offered and opens itself on the press instead — see
   * `TooltipManager.show`.
   *
   * Asking here rather than only on the press is also what makes the walk work:
   * the right button stays down as the pointer crosses rows, so each row the
   * singleton retargets to finds the hold already down and opens at once.
   */
  const onShow: TippyProps['onShow'] = () => (extended.active ? undefined : false);

  /**
   * Open the panel and hand the close to the right button's own release, which
   * may land anywhere — a hold dragged off the row still comes up somewhere.
   * Also the buy cell's, once its press has outlasted a tap.
   */
  function beginHold() {
    if (!rowElem) return;

    extended.open();
    TooltipManager.show(rowElem);
    window.addEventListener('mouseup', endHold);
  }

  /**
   * The press, everywhere but over the buy cell — there the same button is on a
   * clock: a tap cycles the mode, and only a hold reaches this panel. See
   * `PurchaseButton`, which owns that half and calls `beginHold` itself.
   */
  function onRowMousedown(event: MouseEvent) {
    if (event.button !== RIGHT) return;
    if ((event.target as HTMLElement).closest('.purchase-container')) return;

    event.preventDefault();
    beginHold();
  }

  /**
   * Straight up off the row, at the width it always read at. It covers the rows
   * above rather than the rail beside it: the derivation is what you read just
   * before you press, so it wants to be between your eye and the button — and
   * the row it belongs to stays uncovered underneath it.
   *
   * `-end` and not `-start`: the panel's right edge lines up with the cost
   * column's, which is the figure the whole panel is arguing about.
   *
   * ⚠ Pinned to the **row**, which is now also the reference — the whole row is
   * the hold target, so there is one box to point at instead of two cells
   * borrowing a third rect. The buy cell would have been the wrong one either
   * way: it bleeds past the row on both sides (see `PURCHASE_BLEED`).
   *
   * Nothing here turns flip on: `popperOptions` is not in the singleton's
   * `overrides`, so a call site cannot reach it — see `tooltip-manager`. The
   * default box flips already, and to `bottom-end`, which is the fallback this
   * placement wanted anyway: same corner, so the arrow stays where `Tooltip`
   * pins it.
   */
  const tooltipOptions: Partial<TippyProps> = {
    // The hold is the wait. Nothing else may add one, or the press would sit
    // there doing nothing for a beat before the panel came.
    delay: 0,
    interactive: false,
    // The row is a send target and the panel is what you read before you press:
    // a click must not dismiss what says what the click would do.
    hideOnClick: false,
    onShow,
    placement: 'top-end',
    offset: [0, PANEL_OFFSET],
    // Short of nothing on purpose: cut dead, a panel you were still reading
    // reads as a flicker.
    duration: [300, HIDE_MS],
    arrow: true,
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -- role turns interactive with canSend; the linter can't see the ternary. -->
<div class={["row", { compact, lit: isLit, sendable: canSend }]}
  bind:this={rowElem}
  role={canSend ? 'button' : 'group'}
  tabindex={canSend ? 0 : undefined}
  onclick={onRowClick}
  onkeydown={onRowKeydown}
  onmousedown={onRowMousedown}
  onmouseenter={pointAtBand}
  onmouseleave={() => spotlight.clear()}
  {@attach tooltip({ content: tooltipElem, options: tooltipOptions })}
>

  <!-- The clock, as a box. It starts where the ident's own copy runs out and
       ends where the buy cell begins, so the one thing left to author is where
       it starts — the far end is the cell's width and moves with it.

       Out of flow: it draws over the row without taking a cell, so the grid
       places the four real ones exactly as it did before there was a clock. -->
  <div class="wash" aria-hidden="true">
    {#if cohort.isStreaming}
      <span class="flow"></span>
    {:else}
      <span class="fill" bind:this={fillElem}></span>
    {/if}
  </div>

  <div class="ident">

    <div class="header">
      <span class="name">
        {texts[cohort.id]?.title ?? cohort.id}
      </span>

      <!-- Tier is what has been bought; the second half is the run to the count
           that puts the next one on sale. Two different things, so neither one
           may be called `next` alone. Roman, to match the upgrade it names. -->
      {#if cohort.data.upgrade_threshold}
        <div class="level">
          <span class="tier">{cohort.tier ? `${roman(cohort.tier)}` : '-'}</span>
          ·
          <span>
            {#if cohort.isMaxLevel}
              max
            {:else}
              next in {f(cohort.nextUntilThreshold)}
            {/if}
          </span>
        </div>
      {/if}

    </div>

    <span class="description">{texts[cohort.id]?.description ?? ''}</span>

    <!-- A life too short to time is not a fast time, it is a rate — so the
         figure gives way to the word rather than counting down to two decimals
         nobody can read.

         And a life is a length in phases, so it reads in the wave's words: the
         row and the strip above it are the same clock, and whether this cohort
         fits inside a phase is the thing worth knowing about it.

         The countdown beside it is the same line the strip reads — a length,
         then what is left of the one running. It stands where the bar used to,
         which is the whole trade: the bar is the row now. -->
    <span class="duration">
      {#if cohort.isStreaming}
        <span class="stream">stream</span>
      {:else}
        <span>{lifeLabel(cohort.duration)}</span>
        {#if cohort.isInProgress}
          <span class="left">· {remainingLabel} left</span>
        {/if}
      {/if}
      {#if canSend}
        <span class="send" class:sending={cohort.isInProgress}>Send</span>
      {/if}
    </span>

  </div>

  <!-- The roster, and — while the derivation is up — how much of it is actually
       incarnating. The roster rests here because this cell is the one beside the
       buy button: it has to move by exactly what was bought. What the levers took
       off it is the panel's question, so it opens with the panel. See `SoulCount`
       and `extended`. -->
  <div class="count num">
    <SoulCount active={cohort.active} total={cohort.count} extended={extended.active} />
  </div>

  <!-- The button fills this cell, so hovering the cell is hovering the button.
       Its click opts out of the row's own send: buying is never also sending. -->
  <div class="purchase-container" role="group">
    <div class="purchase-button-wrapper">
      <PurchaseButton
        kind={badgeFor(cohort.data.cost_type!)}
        amount={formatCost(cost)}
        {affordable}
        onclick={() => onpurchase?.(quantity)}
        onmouseenter={startPreview}
        onmouseleave={endPreview}
        oncycle={oncyclemode}
        onhold={beginHold}
        {quantity}
      />
    </div>

    <!-- Both, because `Tooltip`'s own `--tooltip-max` would otherwise clamp the
         panel to 320px and the dock's width would be a number that does nothing. -->
    <div
      class="tooltip-wrapper"
      bind:this={tooltipElem}
      style:--tooltip-width="{panelWidth}px"
      style:--tooltip-max="{panelWidth}px"
    >
      <Tooltip>
        <CohortTooltip {cohort} {purchaseMode} />
      </Tooltip>
    </div>
  </div>

</div>

<style>
  .row {
    /* The block padding is a figure two other boxes have to undo — the buy cell
       and the wash both bleed back over it — so it is named once here and each
       of them negates the name. Compact restates the pair and nothing else. */
    --pad-top: var(--sp-3);
    --pad-bottom: 26px;

    /* Named for the wash, which is measured off the padding box and so has to
       add it back to land on the same edges the cells sit on. */
    --pad-inline: 12px;

    /* The buy cell narrows itself by inset inside its own track (see
       `.purchase-container`), so this is the only statement of where that cell
       actually begins — and the wash reads it to know where to stop. */
    --purchase-width: 16ch;

    /* Where the wash begins: the one figure here that is authored and not laid
       out. The ident is shrink-to-fit inside a `1fr` track, so nothing in the
       grid knows where its copy runs out — this is eyeballed against the two
       lines it holds, the name with its unlock run and the life with its
       countdown. */
    --wash-start: 16rem;

    position: relative;
    display: grid;
    grid-template-columns: var(--cohort-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding-inline: var(--pad-inline);
    padding-block: var(--pad-top) var(--pad-bottom);
    margin-inline: calc(var(--pad-inline) * -1);
    border-bottom: var(--rule-row);
    min-width: 0;
    user-select: none;

  }

  /* Every row, not only an affordable one — the tint says which row is being
     read, and the button says whether you can act on it. */
  .row:hover {
    background-color: var(--surface-alt);
  }

  /* The whole row is the send target while there is no clerk — only the
     purchase cell opts back out. */
  .row.sendable {
    cursor: pointer;
  }

  /* The same tint, lit from outside — hovering an upgrade in the rail or the
     catalogue says which row it would change. */
  .row.lit {
    background-color: var(--surface-alt);
  }

  /* The run the clock is drawn across: from where the ident's copy runs out to
     where the buy cell begins. Out of flow, because it is not a cell and must
     not take one — it draws over the row rather than sitting in it, and the
     grid goes on placing everything else as though it were not there.

     Both insets are stated against the row's padding box, which is what an
     absolute box is measured from, so each one carries the inline padding as
     well as its own figure. The right one is the buy cell's own width, which
     means the cell can be rewidened without this being touched.

     `overflow` is what makes the fill work: the fill is this box's full width
     and slides in from the left, so what travels is one edge and the falloff
     on it never changes width — see the effect above. */
  .wash {
    position: absolute;
    inset-block: var(--sp-2);
    left: calc(var(--pad-inline) + var(--wash-start));
    right: calc(var(--pad-inline) + var(--purchase-width));
    overflow: hidden;
    pointer-events: none;
  }

  .fill, .flow {
    display: block;
    height: 100%;
  }

  /* A life in flight, and the one state you have to read without looking for
     it — a rule under the name is lost in a table of rows, and what that cost
     in width the countdown beside it got back.

     The page's own ink at low alpha rather than a light tone, so it composites
     over whatever the row is already wearing — the hover tint, the spotlight
     tint — instead of replacing it. Constant colour, alpha alone ramping, so
     the falloff never dips muddy on its way out.

     **The last stop pair is the only knob**: 90/100 is a tenth of the run spent
     on the leading edge. Parked off the left at rest, so a row between lives
     paints nothing and a landing drops straight back to that. */
  .fill {
    background: rgb(17 17 17 / .05);
    transform: translateX(-100%);
  }

  /* No landing to fill to, so the same ink crosses instead of arriving: a
     shading passing over, not a thing moving. The band is the run's own width
     and travels exactly that in each direction, so **the two middle stops are
     the only knob** — they are the flat top of the band, held nearly shut so a
     whole row of movement never reads as an alarm. */
  .flow {
    background: linear-gradient(
      90deg,
      rgba(17, 17, 17, 0) 0%,
      rgba(17, 17, 17, .04) 46%,
      rgba(17, 17, 17, .04) 54%,
      rgba(17, 17, 17, 0) 100%
    );
    animation: flow 2.4s linear infinite;
  }

  @keyframes flow {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }

  /* Stretch, bleed and hairline come from the global `.purchase-container` in
     app.css. What's left here is this row's own: the block margins negate the
     `.row` padding above, and the width narrows the cell by inset rather than
     by a narrower track — the head and the foot share that track, so shrinking
     it would walk the souls column and crowd the totals. The leading space is
     left empty instead. */
  .purchase-container {
    width: var(--purchase-width);
    margin-left: auto;
    margin-block: calc(var(--pad-top) * -1) calc(var(--pad-bottom) * -1);
  }

  .purchase-button-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .ident {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 0;
    position: relative;
    /* Shrink-to-fit, not the full 1fr track — the tooltip trigger should hug
       what's actually there. The track itself keeps its width regardless, so
       count/purchase stay aligned across rows. */
    justify-self: start;
  }
  .header {
    align-self: start;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    line-height: 1.2;
    z-index: 1;
    position: relative;
    align-self: start;
    display: flex;
    gap: var(--sp-2);

  }
  .tooltip-wrapper { pointer-events: none; }
  .row :global(.tippy-box) { pointer-events: none !important; }

  .description {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    line-height: 1.3;
  }

  .level {
    display: flex;
    align-items: center;
    font-size: 10.5px;
    color: var(--ink-300);
    gap: var(--sp-1);
    text-wrap: nowrap;
  }
  .tier {
    display: grid;
    place-items: center;
    border: 1px solid var(--line-200);
    line-height: 1;
    font-weight: 500;
    font-size: 8px;
    height: 1.5em;
    width: 1.5em;
    text-align: center;
  }

  /* ⚠ Positioned, and only for the paint order: the wash is an absolute box and
     would otherwise paint over it. `.ident` was already relative and the buy
     cell sits past the wash's right edge, so this is the other one that had to
     say it.

     Weights and alignment live in `SoulCount`, which has two figures to set. */
  .count {
    position: relative;
    font-size: var(--fs-sm);
  }

  /* `nowrap` because the containing block is `.ident`, which is shrink-to-fit —
     so a short cohort name used to set the width this line had to wrap inside,
     and the life broke across two rows. It overflows into the track's own slack
     instead, which is what the wider ident column is for. */
  .duration {
    position: absolute;
    bottom: -17px;
    left: 0;
    display: flex;
    align-items: center;
    color: var(--ink-500);
    gap: var(--sp-2);
    font-weight: 500;
    white-space: nowrap;
  }

  /* What the wash across the row says, in figures — the length is the life this
     cohort always lives, this is the one it is living. Quieter than the length
     beside it: the length is the property, the countdown is only the moment. */
  .left {
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }

  /* The word standing where the figure was — same weight, so a row that starts
     streaming does not also get louder. */
  .stream {
    letter-spacing: .08em;
    text-transform: uppercase;
    font-size: .9em;
  }

  /* No clock until the clerk is bought — this is the row's clock in the
     meantime. A hint, not its own control: the row itself is what sends. */
  .send {
    font-weight: 600;
    color: var(--ink-700);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .row.sendable:hover .send {
    color: var(--ink-900);
  }

  /* The verb goes quiet while the trip is out — the row's breathing is what
     says it is working, so the word only has to stop offering. */
  .send.sending {
    color: var(--ink-300);
    text-decoration: none;
  }

  .row.compact {
    --pad-top: 11px;
    --pad-bottom: 20px;

    & .description { display: none; }

    & .count {
      font-size: var(--fs-sm);
      line-height: 1;
      align-self: end;
    }

    & .duration { font-size: 10.5px; }

  }

  .row :global(.purchase::after) {
    content: unset;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    left: 0;
    right: 0;
  }

</style>
