<script lang="ts">
  /**
   * The score, and the two things paying it. One figure and a stack of sources:
   * the total is the figure, so the rows below never add up to anything — they
   * say where it comes from.
   */
  import { Cell, Rate, Reading, Value } from '$ui';
  import { READING_LABELS } from '$lib/labels';

  interface Source {
    /** The source, not the resource — the cell is already named for that. */
    label: string;
    value: string;
    muted?: boolean;
  }

  interface Props {
    amount: string;
    /** Absent until the beat that reveals rates at all. */
    rates?: Source[];
    caption?: string;
  }

  let { amount, rates, caption }: Props = $props();
</script>

<Cell label="Experience" {caption} banded>
  <!-- Captioned like every other figure in the band, and for the band's sake as
       much as its own: bottom-aligned cells only share a baseline if they all
       reserve the caption line. `Total` against the rates beside it, which are
       the flow — the one word that says why the rows below never sum to it. -->
  <Reading label={READING_LABELS.total}>
    <Value kind="xp" value={amount} />

    <!-- Inside the reading, not beside it: the stack belongs to the figure's own
         line, and `Total` underneath has to keep naming the figure alone. -->
    {#if rates}
      <span class="rates">
        {#each rates as rate (rate.label)}
          <Rate {...rate} />
        {/each}
      </span>
    {/if}
  </Reading>
</Cell>

<style>
  /* Tighter than any spacing token: two rates this size read as one block at
     three pixels, and at the caption gap they read as two separate readings —
     which is the one thing the stack must not say.

     The row above puts the *bottom* row on the figure's baseline, so the stack
     grows up into the figure's own height rather than down past it. Two rows of
     this size is about what a 28px figure has above its baseline, which is why
     the pair fits without lifting the band. */
  .rates {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 3px;
    /* What a single rate stands off its figure inside `Value` — the reading's
       own row has no gap, so the distance is paid here to land on the same one. */
    margin-left: calc(var(--badge-gap) + var(--sp-1));
  }
</style>
