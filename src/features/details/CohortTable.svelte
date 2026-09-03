<script lang="ts">
  /**
   * The head is the sum of the rows under it. That is the whole rule the table
   * rests on: the rail carries the total, each row is quiet until you point at
   * it, and a purchase you are only hovering moves both at once.
   */
  import { Label, Section, Tabs } from '$ui';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import type Building from '$lib/buildings/base.svelte';
  import type { YieldType } from '$types';
  import type { PurchaseMode } from './types';
  import CohortRow from './CohortRow.svelte';
  import RateFigure from './RateFigure.svelte';
  import { byRateOrder } from './badge';
  import { resolvePurchasable } from './purchase';

  interface Props {
    title?: string;
    cohorts: Building[];
    purchaseModes?: readonly PurchaseMode[];
    purchaseMode?: PurchaseMode;
    /** The rail of totals. Gated by `details.status`, the beat that reveals rates. */
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

  /** No per-cohort lean column any more — aim is one global dial. See §6. */
  const columns = 'minmax(0, 1fr) 40px 150px';

  /** Which row is hovering its purchase button, if any. */
  let previewId: string | undefined = $state();

  /**
   * Summed off the rows' own figures rather than the manager's, so the rail
   * cannot read a different number than the rows it heads — and so a preview
   * lands in it for free, by counting one cohort at the count it would reach.
   */
  function totalsAt(preview: string | undefined) {
    const totals = new Map<YieldType, number>();
    const add = (type: YieldType, value: number) =>
      totals.set(type, (totals.get(type) ?? 0) + value);

    const isSplit = progression.runs('negKarma');

    // A cohort without its clerk earns nothing until sent by hand — the rail
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

  /** Total souls held across every cohort — the count the label is naming. */
  const totalSouls = $derived(cohorts.reduce((sum, cohort) => sum + cohort.count, 0));

  const totals = $derived(totalsAt(undefined));
  const preview = $derived(new Map(previewId ? totalsAt(previewId) : []));

  function cyclePurchaseMode() {
    const at = purchaseModes.indexOf(purchaseMode);

    onpurchasemode?.(purchaseModes[(at + 1) % purchaseModes.length]);
  }
</script>

<Section label="Incarnations" {title}>
  {#snippet aside()}
    {#if showRates}
      <span class="rail">
        <span class="souls">{f(totalSouls)} souls</span>
        {#each totals as [type, value] (type)}
          <RateFigure
            {type}
            value={preview.get(type) ?? value}
          />
        {/each}
      </span>
    {/if}
  {/snippet}

  <div class="table" style:--cohort-cols={columns}>

    <div class="head">
      <span><Label text="Soul cohort" size="sm" /></span>

      <span class="count right"><Label text="N" size="sm" /></span>

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

  .rail {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
  }

  .souls {
    color: var(--ink-500);
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
