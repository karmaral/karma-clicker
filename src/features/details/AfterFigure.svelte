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
    /**
     * For a figure whose units are not its own — a life, which reads in phases
     * of the world it is lived on. What moved is then the *words*, not the
     * number behind them: two lengths a percent apart name the same landmark and
     * must not draw an arrow at themselves.
     */
    format?: (value: number) => string;
  }

  let { value, after, digits, suffix = '', format }: Props = $props();

  const shown = $derived(format ? format(value) : `${f(value, digits)}`);
  const shownAfter = $derived(
    after === undefined ? undefined : format ? format(after) : `${f(after, digits)}`,
  );

  const moved = $derived(shownAfter !== undefined && shownAfter !== shown);
</script>

<span class="figure">
  {shown}{suffix}
  {#if moved}
    <span class="after">→ {shownAfter}{suffix}</span>
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
