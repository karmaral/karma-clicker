<script lang="ts">
  /**
   * What the rig is, in figures — the capacities the upgrades move, and beneath
   * them what the world you are standing on makes of them. Two blocks and not
   * one: the top half is true wherever you are, the bottom half is this world's
   * offer, and a reader has to be able to tell which is which.
   *
   * Dense on purpose, at the Overview's ahead-panel weight. This column already
   * carries a 355px stage above it, so a row here is a line of text and not a
   * figure on a card — see `AheadRequirements`, which is the same reading at the
   * same size. It carries no `Section` of its own for the same reason: the stage
   * and these figures are one panel, the way the Details column is.
   *
   * Nothing here is bought. The rail beside this screen is where that happens.
   */
  import { PlanetManager } from '$lib/managers';
  import { harness } from '$lib/harness.svelte';
  import { f, formatSpan } from '$lib/utils';
  import planetTexts from '$data/planets-texts';

  const planet = $derived(PlanetManager.getActive());

  const planetName = $derived(planet ? planetTexts[planet.id]?.title ?? planet.id : '');

  /** Job-ms per real second, which is what the rate actually reads as. */
  const placingRate = $derived(harness.speed * 1000);

  const press = $derived(`${(harness.clickMs / 1000).toFixed(2)}s`);

  const step = $derived(`${Math.round(harness.step * 1000) / 10}%`);

  /**
   * Real time, not job time — the job is what the world offers, the countdown is
   * what the souls on it have made of that. Unstaffed there is no answer to give.
   */
  const countdown = $derived(
    harness.speed > 0 ? formatSpan(harness.anchorRemaining / harness.speed) : '—',
  );

  const bonus = $derived(planet ? `+${Math.round(planet.anchorBonus * 100)}%` : '—');

  /** The world offers more than the rig can reach. One line, not a paragraph. */
  const isShort = $derived(Boolean(planet?.anchorSlots) && harness.anchorsAsked < planet.anchorSlots);
</script>

<div class="job">
  <dl class="stats">
    <div class="row">
      <dt>Anchors it can place</dt>
      <dd>{f(harness.anchorCapacity)}</dd>
    </div>
    <div class="row">
      <dt>Riders it can carry</dt>
      <dd>{f(harness.riders)}</dd>
    </div>
    <div class="row">
      <dt>Placing</dt>
      <dd>{f(placingRate)} job-ms/s</dd>
    </div>
    <div class="row">
      <dt>A press buys</dt>
      <dd>{press}</dd>
    </div>
    <div class="row">
      <dt>Split step</dt>
      <dd>{step}</dd>
    </div>
  </dl>
</div>

<style>
  /* Ruled off the stage above it, which is the rest of this one panel. */
  .job {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    border-top: var(--rule-card);
    padding-top: var(--sp-3);
    margin-top: var(--sp-3);
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin: 0;
  }

  /* The world's half, ruled off the rig's rather than titled — one heading for
     the panel is enough at this density. */
  .stats.world {
    border-top: var(--rule-card);
    margin-top: var(--sp-2);
    padding-top: var(--sp-2);
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    min-width: 0;
  }

  dt {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  dd {
    margin: 0;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  dd.dim {
    font-weight: 400;
    color: var(--ink-300);
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
