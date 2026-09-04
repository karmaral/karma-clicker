<script lang="ts">
  /**
   * The one decision on the screen. Your own count drops as you drag, so the
   * cost is felt rather than explained — and the swarm behind it moves with the
   * handle, so it is felt before it is read.
   *
   * One global fraction across every cohort: you never choose which flavour goes.
   */
  import { Label, SliderBar } from '$ui';
  import { getMergeTollLabel } from '$lib/labels';
  import { resolveHarvestDuration } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import type { PlanetHarvestMerge } from '$types';

  interface Props {
    staying: number;
    returning: number;
    /** What `staying` came out as, rounded per cohort — what the clock runs on. */
    share: number;
    /** The handle's own share, 0…1, and the least of it the world will accept. */
    value: number;
    floor: number;
    /** The toll, as a share of the army. 0 is a world that asks none. */
    minimum: number;
    /** What the cycle is measured against — the same terms the clock reads. */
    merge: PlanetHarvestMerge;
    onchange: (share: number) => void;
  }

  let { staying, returning, share, value, floor, minimum, merge, onchange }: Props = $props();

  /**
   * Longest first, so the row runs the way the handle does: more souls staying
   * is a shorter cycle, and dragging right shortens it.
   */
  const CYCLE_WORDS = ['Longest', 'Long', 'Even', 'Short', 'Shortest'];

  /**
   * Which word the split lands on. Read off `resolveHarvestDuration` at both
   * ends rather than off the souls, so the legend cannot disagree with the
   * figure in the panel — one is the other's own scale.
   */
  const lit = $derived.by(() => {
    const slowest = resolveHarvestDuration(1, 0, merge);
    // Merging everything: the fastest a share can ever go, which is the cap or
    // just under it — never an unreachable asymptote, now that the axis is 0…1.
    const fastest = resolveHarvestDuration(1, 1, merge);
    const span = slowest - fastest;
    if (span <= 0) return 0;

    const through = (slowest - resolveHarvestDuration(1, share, merge)) / span;

    return Math.min(CYCLE_WORDS.length - 1, Math.floor(through * CYCLE_WORDS.length));
  });
</script>

<div class="split">
  <div class="counts">
    <span class="side">
      <Label text="Staying" size="sm" />
      <span class="num figure">{f(staying)}</span>
    </span>
    <span class="side end">
      <span class="num figure">{f(returning)}</span>
      <Label text="Returning" size="sm" />
    </span>
  </div>

  <SliderBar {value} {floor} label="Souls to merge" {onchange} />

  <div class="foot">
    <span class="toll">
      {#if minimum}
        Min staying · <span class="num">{getMergeTollLabel(minimum)}</span>
      {/if}
    </span>

    <span class="cycle">
      <Label text="Cycle" size="sm" />
      {#each CYCLE_WORDS as word, i (word)}
        <Label text={word} size="sm" tone={i === lit ? 'active' : 'disabled'} />
      {/each}
    </span>
  </div>
</div>

<style>
  .split {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
    background: var(--surface);
    border: var(--rule-card);
    min-width: 0;
  }

  .counts {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
  }

  /* The label leads on the left and trails on the right, so each pair points
     at the end of the bar it is counting. */
  .side {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
  }

  .figure {
    font-size: var(--fs-xl);
    font-weight: 600;
    color: var(--ink-900);
    line-height: 1;
  }

  .foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .cycle {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
  }
</style>
