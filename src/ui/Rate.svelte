<script lang="ts">
  /**
   * What a standing figure is gaining, beside it: `+12/s`. The unit is set apart
   * from the number because it is the same three characters on every rate in the
   * band — lighter, it stops being read again each time.
   *
   * `label` names the source rather than the resource, for a figure paid by more
   * than one thing. Bare, the rate belongs to whatever figure it stands next to.
   */
  import Label from './Label.svelte';

  interface Props {
    /** Income, already formatted. */
    value: string;
    /**
     * Per second unless told otherwise. Empty for a gain that is owed rather
     * than flowing — a pending figure is still a `+` on the number beside it,
     * and it belongs in the same slot as the rate it stands in for.
     */
    unit?: string;
    /** Where it comes from — omit when the figure beside it already says. */
    label?: string;
    /** Drawn greyed rather than withheld, so a stack of rates keeps its height. */
    muted?: boolean;
  }

  let { value, unit = '/s', label, muted = false }: Props = $props();
</script>

<span class="rate">
  <span class={['num', { muted }]}>
    +{value}{#if unit}<span class="unit">{unit}</span>{/if}
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
