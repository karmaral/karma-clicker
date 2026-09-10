<script lang="ts">
  /**
   * A figure and what an unbought upgrade would make of it. Silent when nothing
   * moves — the panel is the same panel until something in it changes, and a
   * line that always carries an arrow says nothing by carrying one.
   *
   * Any change is drawn as a gain, in both directions: the only cohort upgrades
   * are a shorter life and a bigger yield, and a shorter life is the good one.
   */
  import { f } from '$lib/utils';

  interface Props {
    value: number;
    /** The projected figure. Equal to `value`, or absent, draws nothing. */
    after?: number;
    digits?: number;
    /** Rides inside both halves, so the unit is not read as part of the change. */
    suffix?: string;
  }

  let { value, after, digits, suffix = '' }: Props = $props();

  const moved = $derived(after !== undefined && after !== value);
</script>

<span class="figure">
  {f(value, digits)}{suffix}
  {#if moved}
    <span class="after">→ {f(after!, digits)}{suffix}</span>
  {/if}
</span>

<style>
  .figure {
    white-space: nowrap;
  }

  .after {
    color: var(--status-gain);
    font-weight: 600;
  }
</style>
