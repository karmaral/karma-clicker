<script lang="ts">
  /**
   * The anchoring field. It stands where the cohort roster stands, because while
   * a world is being anchored the roster is not the decision — the split is, and
   * the press. Every figure here is a time or a count of anchors; nothing on this
   * panel is bought.
   */
  import { Label, Meter, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { harness } from '$lib/harness.svelte';
  import { f, formatSpan } from '$lib/utils';
  import type Planet from '$lib/planets/base.svelte';

  interface Props {
    planet: Planet;
  }

  let { planet }: Props = $props();

  const souls = $derived(BuildingManager.countSouls());
  const incarnating = $derived(souls - BuildingManager.countReserved());

  /** Placed ones read full, the one in progress reads live, the rest read empty. */
  const rows = $derived.by(() => {
    return Array.from({ length: planet.anchorsAsked }, (_, i) => ({
      index: i,
      fill: i < planet.anchorsPlaced ? 1 : i === planet.anchorsPlaced ? planet.anchorFill : 0,
      isPlaced: i < planet.anchorsPlaced,
    }));
  });

  /**
   * Real time, not job time — the job is what the world asks, the countdown is
   * what the souls on it have made of that. Unstaffed there is no answer to give.
   */
  const countdown = $derived(
    harness.speed > 0 ? formatSpan(planet.anchorRemaining / harness.speed) : '—',
  );
</script>

<Section label="Anchoring">
  {#snippet aside()}
    {f(harness.workers)} of {f(harness.slots)} slots
  {/snippet}

  <div class="anchors">
    {#each rows as row (row.index)}
      <div class="row">
        <span class="index num">{row.index + 1}</span>
        <Meter 
          value={row.fill} 
          max={1} 
          height="10px"
          theme="dark"
        />
        <span class="state">{row.isPlaced ? 'down' : row.fill > 0 ? 'placing' : 'waiting'}</span>
      </div>
    {/each}
  </div>

  <dl>
    <div class="stat">
      <Label text="Anchors" />
      <span class="num">{f(planet.anchorsPlaced)} of {f(planet.anchorsAsked)}</span>
    </div>
    <div class="stat">
      <Label text="Can incarnate" />
      <span class="num">{f(incarnating)} of {f(souls)}</span>
    </div>
    <div class="stat">
      <Label text="Next anchor in" />
      <span class="num">{countdown}</span>
    </div>
  </dl>

  <p class="note">
    Held souls place the harness instead of incarnating, and the press buys time
    on it instead of experience. Every anchor down pays the souls that do
    incarnate — but only as many of them as it can carry.
  </p>
</Section>

<style>
  .anchors {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
  }

  .row {
    display: grid;
    grid-template-columns: 1.5rem 1fr 4rem;
    align-items: center;
    gap: var(--sp-3);
  }

  .index {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .state {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    text-align: right;
  }

  dl {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin: 0;
    padding: var(--sp-3) 0;
    border-top: var(--rule-card);
  }

  .stat {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
  }

  .stat .num {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--ink-900);
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
