<script lang="ts">
  /**
   * Who rides. A line is permission for one cohort to be carried, and the rider
   * cap is then shared out across the cohorts that hold one — so this table is
   * the whole reading of the anchor bonus: which rows are paid it, and how much
   * of each row the rig can reach.
   *
   * The lines are *bought*, not granted, and one at a time down the roster — so
   * the buy sits on the row it would string, the way a cohort's does. A row that
   * holds a line has nothing left to sell and drops its button; every row past
   * the next one is locked, because lines are taken in order.
   */
  import { Label, PurchaseButton, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { harness } from '$lib/harness.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { pulse } from '$lib/loop';
  import { f, formatCost } from '$lib/utils';
  import texts from '$data/buildings-texts';

  const COLUMNS = 'minmax(0, 1fr) 72px 84px 96px';

  /** One line, priced where it stands. The counter is the roster's own order. */
  const cost = $derived(harness.lineCost(1));
  const affordable = $derived(harness.canPurchaseLine(1));

  const rows = $derived(
    BuildingManager.cohorts.map((id, index) => {
      const cohort = BuildingManager.getBuilding(id);
      const isLined = harness.linedCohorts.includes(id);

      return {
        id,
        title: texts[id]?.title ?? id,
        active: cohort?.active ?? 0,
        riding: harness.ridersFor(id, cohort?.active ?? 0),
        isLined,
        /** The lines run down the roster, so the next one is always the first unstrung row. */
        isNext: harness.isLinesUnlocked && !isLined && index === harness.lines,
      };
    }),
  );

  function purchase() {
    if (!harness.purchaseLine(1)) return;

    pulse();
  }
</script>

<Section label="Lines" highlighted={spotlight.isLit('harness')}>
  {#snippet aside()}
    {f(harness.lines)} of {f(rows.length)} cohorts
  {/snippet}

  {#if !harness.isLinesUnlocked}
    <p class="locked">A line is bought once the harness can string one.</p>
  {/if}

  <div class="table" style:--line-cols={COLUMNS}>
    <div class="head">
      <span><Label text="Cohort" size="sm" /></span>
      <span class="right"><Label text="Out" size="sm" /></span>
      <span class="right"><Label text="Riding" size="sm" /></span>
      <span class="right"><Label text="Line" size="sm" /></span>
    </div>

    {#each rows as row (row.id)}
      <div class={['row', { lined: row.isLined, next: row.isNext }]}>
        <span class="name">{row.title}</span>
        <span class="num right">{f(row.active)}</span>
        <span class="num right">{row.isLined ? f(row.riding) : '—'}</span>

        <!-- The one row with a line left to sell fills this cell with the buy,
             the way a cohort row does. The rest read as a state, because there
             is nothing to press: a strung row is done and the ones behind it
             are waiting their turn. -->
        {#if row.isNext}
          <div class="purchase-container">
            <PurchaseButton
              kind="red-both"
              amount={formatCost(cost)}
              quantity={0}
              {affordable}
              onclick={purchase}
            />
          </div>
        {:else}
          <span class="state right">{row.isLined ? 'strung' : 'locked'}</span>
        {/if}
      </div>
    {/each}

    {#if !rows.length}
      <p class="note">No cohorts yet. A line carries souls, so it waits for some.</p>
    {/if}
  </div>

  <p class="note">
    Only a cohort on a line is carried, and only a carried soul is paid the anchor
    bonus. The riders the harness holds are shared across the lines, so a new line
    spreads what you have as well as reaching further.
  </p>
</Section>

<style>
  .locked {
    margin: 0;
    padding-bottom: var(--sp-3);
    border-bottom: var(--rule-card);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .table {
    display: flex;
    flex-direction: column;
    padding-top: var(--sp-3);
    min-width: 0;
  }

  .head {
    display: grid;
    grid-template-columns: var(--line-cols);
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

  .right {
    justify-content: flex-end;
    text-align: right;
  }

  /* Bled out to the card's edge so the buy cell can reclaim the padding, as the
     cohort rows do — the head is unpadded and the two still line up. */
  .row {
    display: grid;
    grid-template-columns: var(--line-cols);
    column-gap: var(--sp-3);
    align-items: baseline;
    padding-inline: 12px;
    padding-block: var(--sp-2);
    margin-inline: -12px;
    border-bottom: var(--rule-row);
    min-width: 0;
    color: var(--ink-200);
  }

  /* Dim until it is strung. The rows lighting up in turn is what a line buys. */
  .row.lined {
    color: var(--ink-500);

    & .name { color: var(--ink-900); }
    & .num { color: var(--ink-900); font-weight: 600; }
  }

  /* The row you can act on reads at full strength before it is paid for — it is
     the only one on the table that is a decision. */
  .row.next {
    color: var(--ink-500);

    & .name { color: var(--ink-900); }
  }

  .row.next:hover {
    background-color: var(--surface-alt);
  }

  /* Negates the row's own padding; the rest is the global `.purchase-container`.
     A shorter row than the cohort and token tables, so the hairline's inset is
     pulled in to match — the standard 20px would leave almost no mark. */
  .purchase-container {
    --rule-inset: var(--sp-3);
    margin-block: calc(var(--sp-2) * -1);
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    min-width: 0;
  }

  .num {
    font-size: var(--fs-sm);
  }

  .state {
    font-size: var(--fs-sm);
  }

  .note {
    margin: 0;
    padding-top: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
