<script lang="ts">
  /**
   * Flow, beside a standing figure: `+12/s`. The unit is set apart from the
   * number because it is the same three characters on every rate in the band —
   * lighter, it stops being read again each time.
   *
   * `label` names the source rather than the resource, for a figure paid by more
   * than one thing. Bare, the rate belongs to whatever figure it stands next to.
   */
  import Label from './Label.svelte';

  interface Props {
    /** Per-second income, already formatted. */
    value: string;
    /** Where it comes from — omit when the figure beside it already says. */
    label?: string;
    /** Drawn greyed rather than withheld, so a stack of rates keeps its height. */
    muted?: boolean;
  }

  let { value, label, muted = false }: Props = $props();
</script>

<span class="rate">
  <span class={['num', { muted }]}>
    +{value}<span class="unit">/s</span>
  </span>
  {#if label}
    <Label text={label} size="caption" tone={muted ? 'disabled' : 'inactive'} />
  {/if}
</span>

<style>
  .rate {
    display: inline-flex;
    align-items: baseline;
    gap: var(--gap-caption);
    line-height: 1;
  }

  .num {
    font-size: var(--fs-sm);
    font-weight: 600;
    font-stretch: var(--wd-figure);
    color: var(--ink-500);
    white-space: nowrap;
  }

  .num.muted { color: var(--ink-200); }

  .unit {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--ink-300);
    margin-left: 1px;
  }

  .num.muted .unit { color: var(--ink-200); }
</style>
