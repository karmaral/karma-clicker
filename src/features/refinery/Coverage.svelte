<script lang="ts">
  /**
   * The mechanic itself — see `docs/design.md` §9. Coverage is a saturating
   * share of what is produced, not what is held, so the bar reads a percentage
   * rather than a pile against a prediction. It approaches 100% and never
   * reaches it — the backlog always grows, by construction — so there is no
   * milestone at the top of the meter; the earned payoff lives in the level's
   * conversion ratio instead (see Refining).
   *
   * The sole home of the reading — Refining used to headline it too, and a share
   * said twice is a share said once too often.
   *
   * No history under the meter: a trend is worth drawing when the reading
   * wanders, and coverage only moves on a real event, so the curve was a flat
   * line restating the bar above it.
   *
   * Everything here is stated across both poles, matching Refining's headline,
   * so nothing on the screen silently halves.
   */
  import { Meter, Section } from '$ui';
  import { refinery } from '$lib/refinery.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f } from '$lib/utils';

  const isIdle = $derived(refinery.workers <= 0);
  const pct = $derived(refinery.coverage * 100);

  /** Forecast — what the meter's percentage is of. */
  const cleared = $derived(refinery.perSecond * 2);

  /** What the trend converges onto: cohort karma, bias and aim split excluded. */
  const produced = $derived(refinery.shortPileIncome * 2);
</script>

<Section label="Coverage" highlighted={spotlight.isLit('refinery')}>
  {#snippet aside()}
    {f(refinery.workers)} souls staffing it · {f(refinery.slots)} slots
  {/snippet}

  {#if isIdle}
    <p class="held">Unstaffed — nothing is cleared.</p>
  {:else}
    <p class="held">Keeps up with <strong>{f(pct)}%</strong> of what you produce</p>
  {/if}

  <div class="track">
    <Meter value={pct} height="8px" />
  </div>

  <p class="caption">
    {#if isIdle}
      {f(produced)} karma/s produced, none of it cleared
    {:else}
      {f(cleared)} of {f(produced)} karma/s produced cleared
    {/if}
  </p>
</Section>

<style>
  .held {
    margin: 0;
    font-size: var(--fs-base);
    color: var(--ink-900);
  }

  .held strong {
    font-weight: 600;
  }

  .track {
    min-width: 0;
  }

  .caption {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
