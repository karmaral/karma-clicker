<script lang="ts">
  /**
   * A count standing next to a label, for something buyable behind it that you
   * cannot currently see. The one **filled** mark in a system that otherwise
   * says everything in rules and borders, and that is deliberate: it has to
   * carry across the header from a tab you are not on, and an outline at this
   * size reads as another figure rather than as a signal.
   *
   * Nothing is drawn at 0 — an empty pip is a badge saying there is no news,
   * which is worse than the absence it is trying to report.
   */
  interface Props {
    count: number;
    /** What the count is of, for anyone reading the tab rather than seeing it. */
    label: string;
  }

  let { count, label }: Props = $props();
</script>

{#if count > 0}
  <span class="pip" aria-label="{count} {label}">{count}</span>
{/if}

<style>
  .pip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    background: var(--ink-900);
    color: var(--surface);
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
</style>
