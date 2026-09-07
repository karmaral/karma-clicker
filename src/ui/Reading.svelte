<script lang="ts">
  /**
   * A figure and the word for what it counts. The cell's own title says what the
   * reading is of; this says what each figure inside it is, so a row of them
   * reads as named columns rather than as numbers that happen to be spaced
   * apart — the spacing stops being the only thing holding them together.
   *
   * The label goes under the figure, the side the excess meter already captions
   * itself on, so every sub-label in the band sits on one line.
   */
  import type { Snippet } from 'svelte';
  import Label from './Label.svelte';

  interface Props {
    label: string;
    /**
     * A second item on the caption rail, for a qualifier the figure above has no
     * room for — the excess meter already reads `Burden −34%` down there, so the
     * rail is where a reading puts what it cannot say in one number.
     */
    note?: Snippet;
    children: Snippet;
  }

  let { label, note, children }: Props = $props();
</script>

<span class="reading">
  <span class="figure">{@render children()}</span>
  <span class="rail">
    <Label text={label} size="caption" />
    {@render note?.()}
  </span>
</span>

<style>
  /* --gap-caption, which the excess meter leaves under its track too: the same
     figure-to-caption distance everywhere is what lets one baseline alignment
     put the whole band's figures on one line as well as its captions. */
  .reading {
    display: flex;
    flex-direction: column;
    gap: var(--gap-caption);
    min-width: 0;
  }

  /* The figure row, and it is a baseline: a reading may set more than the figure
     here — the sources paying it — and those have to sit on the number's own
     line rather than on the middle of its box.
     `last baseline`, so a stack beside the figure hangs *upward* off its bottom
     row. Downward is the one direction it cannot grow: the band bottom-aligns
     every cell to put the captions on one rail, and anything reaching below the
     baseline lands in that rail. */
  .figure {
    display: flex;
    align-items: last baseline;
  }

  /* Tight, unlike the meter's own readout: that rail holds two separate readings
     apart, this one is a name and a qualifier on it — one phrase, so it wants a
     phrase's spacing and the note brings its own separator. */
  .rail {
    display: flex;
    align-items: baseline;
    gap: var(--badge-gap);
    min-width: 0;
  }
</style>
