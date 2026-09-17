<script lang="ts">
  /**
   * The foot is the sum of the rows above it. That is the whole rule the table
   * rests on: the foot row carries the total, each row is quiet until you point
   * at it, and a purchase you are only hovering moves both at once.
   */
  import { Label, Section, Tabs } from '$ui';
  import { progression } from '$lib/progression';
  import type Building from '$lib/buildings/base.svelte';
  import type { YieldType } from '$types';
  import type { PurchaseMode } from './types';
  import CohortRow from './CohortRow.svelte';
  import RateFigure from './RateFigure.svelte';
  import SoulCount from './SoulCount.svelte';
  import { extended } from './extended.svelte';
  import { byRateOrder } from './badge';
  import { resolvePurchasable } from './purchase';

  interface Props {
    title?: string;
    cohorts: Building[];
    purchaseModes?: readonly PurchaseMode[];
    purchaseMode?: PurchaseMode;
    /** The foot row of totals. Gated by `details.status`, the beat that reveals rates. */
    showRates?: boolean;
    note?: string;
    onpurchasemode?: (mode: PurchaseMode) => void;
    onpurchase?: (id: string, quantity: number) => void;
  }

  let {
    title,
    cohorts,
    purchaseModes = ['1', '10', 'Next', 'Max'],
    purchaseMode = '1',
    showRates = false,
    note,
    onpurchasemode,
    onpurchase,
  }: Props = $props();

  /**
   * No per-cohort lean column any more — aim is one global dial. See §6.
   * One soul track, not two: the reserved share is a single global lever restated
   * in every row, so it reads as the denominator of what is incarnating rather
   * than as a column of its own — and only in the extended register at that.
   *
   * Held at the width of the **pair** rather than of the roster normally showing
   * in it, so opening the register widens nothing: the incarnating figure opens
   * into slack the column was already holding. Past the counts play actually
   * reaches it runs on into the slack to its right, which the last track has
   * because the buy button is pinned to that track's far edge and does not fill
   * it.
   *
   * That last track is sized by the **foot's rates**, not by the button — three
   * or four figures on one line is the widest thing the column ever holds, and
   * it used to run out of room and spill left over the roster.
   */
  const columns = 'minmax(0, 1fr) 13ch 1fr';

  /** Which row is hovering its purchase button, if any. */
  let previewId: string | undefined = $state();

  /**
   * Summed off the rows' own figures rather than the manager's, so the foot
   * cannot read a different number than the rows above it — and so a preview
   * lands in it for free, by counting one cohort at the count it would reach.
   */
  function totalsAt(preview: string | undefined) {
    const totals = new Map<YieldType, number>();
    const add = (type: YieldType, value: number) =>
      totals.set(type, (totals.get(type) ?? 0) + value);

    const isSplit = progression.runs('negKarma');

    // A cohort without its clerk earns nothing until sent by hand — the foot
    // reads the standing rate, not what a full send queue would pay.
    cohorts.filter((cohort) => cohort.isAutonomous).forEach((cohort) => {
      const count = cohort.id === preview
        ? cohort.count + resolvePurchasable(cohort, purchaseMode)
        : cohort.count;

      Object.keys(cohort.production).forEach((key) => {
        const type = key as YieldType;
        if (type !== 'karma') return add(type, cohort.perSecond(type, count));

        const karma = cohort.karmaPerSecond(count);
        if (!isSplit) return add('karma', karma.positive);

        add('karma_negative', karma.negative);
        add('karma_positive', karma.positive);
      });
    });

    return [...totals].sort(([a], [b]) => byRateOrder(a, b));
  }

  /**
   * Both halves of the column above it, in the same order the rows put them: the
   * roster rests, and what is incarnating opens with the register. The roster is
   * the honest total — it is what every purchase moved — so the sum can be
   * checked against what you bought.
   */
  const totalIncarnating = $derived(cohorts.reduce((sum, cohort) => sum + cohort.active, 0));
  const totalOwned = $derived(cohorts.reduce((sum, cohort) => sum + cohort.count, 0));

  const totals = $derived(totalsAt(undefined));
  const preview = $derived(new Map(previewId ? totalsAt(previewId) : []));

  function cyclePurchaseMode() {
    const at = purchaseModes.indexOf(purchaseMode);

    onpurchasemode?.(purchaseModes[(at + 1) % purchaseModes.length]);
  }
</script>

<Section label="Soul cohorts" {title}>
  <div class="table" style:--cohort-cols={columns}>

    <div class="head">

      <span><Label text="Name" size="sm" /></span>

      <!-- What rests under it is the roster, so that is what it names. The lore
           word went with the figure it belongs to: `SoulCount` says `of` when
           the incarnating count is showing, and the tooltip says the rest. -->
      <span class="count"><Label text="Souls" size="sm" /></span>

      <!-- The head cell is the switcher: the words are a read-out of where the
           cycle is, and clicking anywhere in the cell advances it. -->
      <button type="button" class="cost right" onclick={cyclePurchaseMode}>
        <Label text="Cost ×" size="sm" />
        <Tabs tabs={purchaseModes} active={purchaseMode} size="sm" interactive={false} />
      </button>
    </div>

    {#each cohorts as cohort (cohort.id)}
      <CohortRow
        {cohort}
        {purchaseMode}
        onpreview={(id) => (previewId = id)}
        onpurchase={(quantity) => onpurchase?.(cohort.id, quantity)}
        oncyclemode={cyclePurchaseMode}
      />
    {/each}

    {#if showRates}
      <div class="foot">
        <span><Label text="Total" size="sm" muted /></span>

        <!-- The foot follows the rows into the extended register, or the sum
             would be the one figure in the column with nothing to check. -->
        <span class="count num">
          <SoulCount active={totalIncarnating} total={totalOwned} extended={extended.active} />
        </span>

        <span class="rates">
          {#each totals as [type, value] (type)}
            <RateFigure
              {type}
              value={preview.get(type) ?? value}
            />
          {/each}
        </span>
      </div>
    {/if}
  </div>

  {#if note}
    <p class="note">{note}</p>
  {/if}
</Section>

<style>
  .table {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .foot {
    display: grid;
    grid-template-columns: var(--cohort-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding-top: var(--sp-2);
  }

  .foot .count {
    font-size: var(--fs-base);
    color: var(--ink-900);
  }

  .foot .rates {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-4);
    min-width: 0;
  }

  .head {
    display: grid;
    grid-template-columns: var(--cohort-cols);
    column-gap: var(--sp-3);
    align-items: end;
    padding-bottom: var(--sp-1);
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .head > span {
    display: flex;
    line-height: 1;
  }

  .head .right {
    justify-content: flex-end;
  }

  /* Left, with the figures under it — the roster's own left edge at rest, which
     is where the reading starts.

     It may be wider than its track, and is allowed to be: what is to its right
     is the cost heading, which right-aligns into the far edge of a track the
     button does not fill. So the overflow lands in slack rather than on
     anything, and the track stays sized for figures instead of for a word. */
  .head .count :global(.label) {
    white-space: nowrap;
  }

  .cost {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    padding: var(--sp-1) var(--sp-2);
    margin: calc(var(--sp-1) * -1) calc(var(--sp-2) * -1);
    border: none;
    background: transparent;
    line-height: 1;
    white-space: nowrap;
  }
  .cost:hover {
    background-color: var(--surface-alt);
  }
  .cost:hover :global(.tab:not(.active)) {
    color: var(--ink-500);
  }
  /* Tight enough that the label and four words hold one rail at 184px. */
  .cost :global(.tabs) {
    gap: var(--sp-2);
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
