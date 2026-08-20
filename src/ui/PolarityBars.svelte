<script lang="ts">
  /**
   * The two piles as two lengths from one origin. Quantities only — how big each
   * is, which is bigger, and where they agree. What that difference costs you is
   * the excess meter's job, and is not drawn twice.
   *
   * The larger pile fills the track, so the pair stays readable at any scale and
   * never divides by the wall, which is a provisional number.
   */

  interface Props {
    negative: number;
    positive: number;
    height?: string;
  }

  let { negative, positive, height = '11px' }: Props = $props();

  const largest = $derived(Math.max(negative, positive));

  const share = (amount: number) => (largest > 0 ? `${(amount / largest) * 100}%` : '0%');

  /** Where the shorter bar ends: everything left of it is paired off. */
  const matched = $derived(share(Math.min(negative, positive)));
</script>

<div class="bars">
  <div class="track" style:height>
    <span class="span neg" style:width={share(negative)}></span>
  </div>
  <div class="track" style:height>
    <span class="span pos" style:width={share(positive)}></span>
  </div>
  <span class="matched" style:left={matched}></span>
</div>

<style>
  .bars {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    min-width: 0;
  }

  .track {
    position: relative;
    background: var(--canvas);
  }

  .span {
    position: absolute;
    inset: 0 auto 0 0;
    display: block;
  }

  .span.neg { background: var(--hatch-neg-bar); }

  .span.pos {
    background: var(--hatch-pos-bar);
    box-shadow: var(--hatch-pos-edge);
  }

  /* Crosses both tracks, so matched is one reading rather than two marks. */
  .matched {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 1px;
    background: var(--ink-900);
  }
</style>
