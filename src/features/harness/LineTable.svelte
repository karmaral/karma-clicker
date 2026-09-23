<script lang="ts">
  /**
   * Who rides. A line is permission for one cohort to be carried, and the rider
   * cap is then shared out across the cohorts that hold one — so this table is
   * the whole reading of the anchor bonus: which rows are paid it, and how much
   * of each row the rig can reach.
   *
   * The lines are *bought*, not granted, and one at a time down the roster — so
   * there is only ever one buy, and it sits at the foot of the table rather than
   * on a row. Every row reads as a state: strung, next, or locked behind it.
   *
   * A line is a family of the harness, so this world's anchors bound them: the
   * rows are line slots, grouped by the anchor count whose families first hold
   * them. Past the eighth the ladder goes round again, so a row can repeat.
   */
  import { Label, PurchaseButton, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { spotlight } from '$lib/spotlight.svelte';
  import { pulse } from '$lib/loop';
  import { harness, cohortOfLine } from '$lib/harness.svelte';
  import { f, formatCost } from '$lib/utils';
  import { ANCHOR_MAX, linesFor } from '$widgets/planet';
  import { COHORT_COUNT } from '$data/buildings';
  import texts from '$data/buildings-texts';

  const COLUMNS = 'minmax(0, 1fr) 72px 84px 96px';

  /** The strung row under the pointer, for the rig to draw alone. */
  let { onpoint }: { onpoint?: (line: number | undefined) => void } = $props();

  /** One line, priced where it stands. The counter is the roster's own order. */
  const cost = $derived(harness.lineCost(1));
  const affordable = $derived(harness.canPurchaseLine(1));

  /** Line slots, one row each — a cohort past the ladder's first pass holds more. */
  function rowOf(line: number, id: string) {
    const cohort = BuildingManager.getBuilding(id);

    return {
      line,
      title: texts[id]?.title ?? id,
      /** Which time round the ladder — the bonus multiple this line makes. */
      pass: Math.floor(line / COHORT_COUNT) + 1,
      active: cohort?.active ?? 0,
      riding: harness.ridersFor(id, cohort?.active ?? 0),
      isStrung: line < harness.strung,
      /** Bought on a larger world, and waiting for a family here. */
      isWaiting: line >= harness.strung && line < harness.lines,
      isNext: harness.isLinesUnlocked && line === harness.lines && line < harness.lineCapacity,
    };
  }

  /**
   * The slots each anchor count adds, for every count this world holds and one
   * past it. A cohort the roster lacks ends the list — past it is a spoiler.
   */
  const groups = $derived.by(() => {
    const roster = BuildingManager.cohorts;
    const shown = Math.min(ANCHOR_MAX, harness.anchorsAsked + 1);
    const out = [];

    for (let anchors = 1; anchors <= shown; anchors++) {
      const rows = [];
      let line = linesFor(anchors - 1);

      for (; line < linesFor(anchors); line++) {
        const id = cohortOfLine(line);
        if (!roster.includes(id)) break;

        rows.push(rowOf(line, id));
      }

      if (rows.length) out.push({ anchors, rows, isHeld: anchors <= harness.anchorsAsked });
      if (line < linesFor(anchors)) break;
    }

    return out;
  });

  const rows = $derived(groups.flatMap((group) => group.rows));

  /** The one row the buy would string, and the whole reason the foot is there. */
  const next = $derived(rows.find((row) => row.isNext));

  /** Every family here strung, with another anchor's worth still to show. */
  const isBlocked = $derived(
    harness.isLinesUnlocked && harness.lines >= harness.lineCapacity && groups.some((group) => !group.isHeld),
  );

  function anchorsLabel(count: number) {
    return `${count} ${count === 1 ? 'anchor' : 'anchors'}`;
  }

  function stateOf(row: ReturnType<typeof rowOf>) {
    if (row.isStrung) return 'strung';
    if (row.isWaiting) return 'waiting';

    return row.isNext ? 'next' : 'locked';
  }

  function purchase() {
    if (!harness.purchaseLine(1)) return;

    pulse();
  }
</script>

<Section label="Lines" highlighted={spotlight.isLit('harness')}>
  {#snippet aside()}
    {f(harness.strung)} of {f(harness.lineCapacity)} lines
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

    {#each groups as group (group.anchors)}
      <div class={['group', { held: group.isHeld }]}>
        <Label text={anchorsLabel(group.anchors)} size="sm" />
        <span class="state">{group.isHeld ? 'held' : 'locked'}</span>
      </div>

      <!-- A repeat line shows its multiple rather than the cohort's figures
           again — they are the first line's, and printed twice read as two crowds. -->
      {#each group.rows as row (row.line)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={['row', { lined: row.isStrung, next: row.isNext }]}
          onmouseenter={() => row.isStrung && onpoint?.(row.line)}
          onmouseleave={() => onpoint?.(undefined)}
        >
          <span class="name">
            {row.title}
            {#if row.pass > 1}<span class="pass">×{row.pass}</span>{/if}
          </span>
          <span class="num right">{row.pass > 1 ? '—' : f(row.active)}</span>
          <span class="num right">{row.isStrung && row.pass === 1 ? f(row.riding) : '—'}</span>

          <!-- Every row is a reading, never a press: a strung row is done, the
               next one is what the foot would buy, and the rest wait their turn. -->
          <span class="state right">{stateOf(row)}</span>
        </div>
      {/each}
    {/each}

    {#if !rows.length}
      <p class="note">
        {harness.anchorsAsked
          ? 'No cohorts yet. A line carries souls, so it waits for some.'
          : 'This world offers no anchors, so it holds no lines.'}
      </p>
    {/if}

    <!-- The single buy. One line is sold at a time, so it is the table's foot
         rather than a cell — named on the left so the press is not a guess, and
         under the Line column so it still ends the column it acts on. -->
    {#if next}
      <div class="foot">
        <span class="name">String {next.title}{next.pass > 1 ? ` again (×${next.pass})` : ''}</span>
        <div class="purchase-container">
          <PurchaseButton
            kind="red-both"
            amount={formatCost(cost)}
            {affordable}
            onclick={purchase}
          />
        </div>
      </div>
    {:else if isBlocked}
      <p class="foot-note">The next line needs another anchor on this world.</p>
    {:else if harness.isLinesUnlocked && harness.lines < harness.lineCapacity && rows.length}
      <p class="foot-note">The next line waits for a new cohort.</p>
    {:else if harness.isLinesUnlocked && rows.length}
      <p class="foot-note">Every line this world holds is strung.</p>
    {/if}
  </div>

  <p class="note">
    Only a cohort on a line is carried, and only a carried soul is paid the anchor
    bonus. The riders the harness holds are shared across the lines, so a new line
    spreads what you have as well as reaching further. Each anchor on this world and
    each span between two holds one line; once every cohort has one, the next goes
    back to the first, and pays its bonus again.
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

  /* An anchor count's header: the rows under it are the lines it adds. Dim until
     the rig holds that many, the way an unstrung row is. */
  .group {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: var(--sp-3);
    padding-bottom: var(--sp-1);
    border-bottom: var(--rule-row);
    color: var(--ink-200);

    &.held { color: var(--ink-500); }
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

  .row.lined:hover {
    background-color: var(--surface-alt);
  }

  /* The row the foot would string reads at full strength before it is paid for —
     it is the only one on the table that is a decision. */
  .row.next {
    color: var(--ink-500);

    & .name { color: var(--ink-900); }
    & .state { color: var(--ink-900); }
  }

  /* The table's one buy, laid on the row grid so the button ends the Line
     column. Bled like a row; no rule of its own, the last row's is the seam. */
  .foot {
    display: grid;
    grid-template-columns: var(--line-cols);
    column-gap: var(--sp-3);
    align-items: center;
    padding-inline: 12px;
    padding-block: var(--sp-2);
    margin-inline: -12px;
    min-width: 0;

    & .name { grid-column: 1 / 4; color: var(--ink-900); }
  }

  .foot:hover {
    background-color: var(--surface-alt);
  }

  /* Negates the foot's own padding; the rest is the global `.purchase-container`.
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

  .pass {
    font-size: var(--fs-sm);
    font-weight: 400;
    color: var(--ink-500);
  }

  .state {
    font-size: var(--fs-sm);
  }

  .foot-note {
    margin: 0;
    padding-top: var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .note {
    margin: 0;
    padding-top: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
