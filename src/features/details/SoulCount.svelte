<script lang="ts">
  /**
   * A roster and how much of it is incarnating, as one figure. The pair and not
   * two columns: what holds souls back is a single global lever, so a column of
   * its own would restate one setting once per row — and the subtraction would
   * still be left to the reader.
   *
   * **The roster is what rests here.** This column stands beside the buy button,
   * which makes it the ledger, and a ledger figure has to move by exactly what
   * was bought — ten bought must read as ten, whatever share of them the levers
   * then hold back. Standing the incarnating figure here instead was the whole of
   * the original dishonesty, and putting it back at rest would be the same bug
   * with an extra register in front of it.
   *
   * What is incarnating arrives in the **extended** register — while the
   * derivation is up, which is the one moment the missing souls are the question.
   * It opens leftward, so the roster slides but never changes value: the figure
   * you were reading is still the figure you are reading.
   *
   * With nothing held the two are the same number, and then it stays a single
   * figure even extended: `10 of 10` is not a second reading.
   */
  import { f } from '$lib/utils';

  interface Props {
    active: number;
    total: number;
    /** The table's register while the derivation is held open — see `extended`. */
    extended?: boolean;
  }

  let { active, total, extended = false }: Props = $props();

  const showsTotal = $derived(extended && active !== total);
</script>

<span class="souls">
  {#if showsTotal}
    <span class="active">{f(active)}</span>
    <span class="of">of</span>
  {/if}
  <span class="total">{f(total)}</span>
</span>

<style>
  /* Unbreakable: a pair split across two lines is two numbers. Overflow runs
     rightward, into the slack the last track has past its right-pinned button —
     and only at counts the ladder does not reach. */
  .souls {
    display: block;
    text-align: left;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  /* Same weight, both of them: these are two figures of one kind and a weight
     step would read as a hierarchy rather than as a pair. */
  .active, .total {
    font-weight: 600;
  }

  .active {
    color: var(--ink-900);
  }

  /* A step of ink and nothing else. It is the column's figure at rest and has to
     hold the table on its own, so it cannot go far — but once the pair opens,
     what is incarnating is the reading and the roster is what it is measured
     against, so the darker ink belongs to the left.

     Unconditional rather than stepped on the register: a figure that restyles
     itself under the pointer reads as a flicker, and the gap only has to be
     wide enough to order the two while they are both there. */
  .total {
    color: var(--ink-700);
  }

  /* The word is the column's second heading: it says what the two figures are to
     each other, which is what the `Held` label used to have to say. Quiet enough
     to read as a join rather than as a third figure.

     ⚠ `line-height: 0` is load-bearing, not styling. A font's ascent and descent
     are rounded to whole pixels at the size they are used, so a smaller run can
     descend a hair *further* below the baseline than the figures beside it —
     the line box grows by that hair, snaps to a device pixel, and since compact
     rows align their count to the bottom, the number lifts 1px on whichever rows
     sat on the wrong side of the grid. Zero collapses this box around its own
     content and takes it out of the line's height entirely; the glyph still
     paints and still sits on the shared baseline.

     10.5px, which is `.level` and the compact `.duration` in `CohortRow` — not a
     token. `--fs-label` is 10 and `--fs-label-sm` is 9.5. */
  .of {
    font-size: 10.5px;
    line-height: 0;
    font-weight: 500;
    color: var(--ink-300);
  }
</style>
