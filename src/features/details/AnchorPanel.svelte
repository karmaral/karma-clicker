<script lang="ts">
  /**
   * The anchoring field, drawn while a job you began is going down. It stands
   * where the cohort roster stands, because for as long as it is up the roster is
   * not the decision — the split is, and the press. Every figure here is a time
   * or a count of anchors; nothing on this panel is bought, and what the rig
   * *could* do is the Harness tab's reading rather than this one's.
   *
   * How many anchors are asked for and how far in they are comes off `harness`,
   * not the world: the world offers slots and the rig decides how many of them
   * it can fill.
   */
  import { AnchorGlyph, Label, Meter, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { harness } from '$lib/harness.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f, formatSpan } from '$lib/utils';
  import type Planet from '$lib/planets/base.svelte';

  interface Props {
    planet: Planet;
  }

  let { planet }: Props = $props();

  const souls = $derived(BuildingManager.countSouls());
  const incarnating = $derived(souls - BuildingManager.countReserved());

  /**
   * What the souls the split let go are earning right now. Both figures run
   * through `yieldScale`, so an anchor landing moves them in the same frame the
   * bar fills — which is the whole reason they stand beside the bars.
   */
  const experience = $derived(BuildingManager.countExperiencePerSecond());
  const karma = $derived(BuildingManager.countKarmaPerSecond());

  /** Placed ones read full, the one in progress reads live, the rest read empty. */
  const rows = $derived.by(() => {
    const placed = harness.anchorsPlaced;

    return Array.from({ length: harness.anchorsAsked }, (_, i) => ({
      index: i,
      fill: i < placed ? 1 : i === placed ? harness.anchorFill : 0,
      isPlaced: i < placed,
    }));
  });

  /** Nominal, per anchor. What one more down adds before coverage takes its cut. */
  const bonus = $derived(`+${Math.round(planet.anchorBonus * 100)}%`);

  /**
   * What the placed ones actually pay, across the cohorts that hold a line. The
   * multiplier is per cohort now, so the panel's one figure is the average the
   * rig is paying — weighted by what each lined cohort has out, which is the
   * same weighting the riders are shared by.
   */
  const carried = $derived.by(() => {
    return harness.linedCohorts.reduce((sum: number, id: string) => {
      const active = BuildingManager.getBuilding(id)?.active ?? 0;

      return sum + harness.ridersFor(id, active);
    }, 0);
  });

  const multiplier = $derived.by(() => {
    let weighted = 0;
    let out = 0;

    for (const id of harness.linedCohorts) {
      const active = BuildingManager.getBuilding(id)?.active ?? 0;
      if (active <= 0) continue;

      weighted += harness.multiplierFor(id, active) * active;
      out += active;
    }

    return out > 0 ? weighted / out : 1;
  });

  /**
   * Real time, not job time — the job is what the world asks, the countdown is
   * what the souls on it have made of that. Unstaffed there is no answer to give.
   */
  const countdown = $derived(
    harness.speed > 0 ? formatSpan(harness.anchorRemaining / harness.speed) : '—',
  );
</script>

<Section label="Anchoring" highlighted={spotlight.isLit('harness')}>
  {#snippet aside()}
    {f(harness.workers)} of {f(harness.slots)} slots
  {/snippet}

  <!-- The cost of the lever, priced. Everything below is what buys it back. -->
  <p class="out">
    <span class="num">{f(incarnating)}</span> of {f(souls)} incarnating ·
    <span class="num">{f(experience)}</span> xp/s ·
    <span class="num">{f(karma)}</span> karma/s
  </p>

  <div class="anchors">
    {#each rows as row (row.index)}
      <div class="row">
        <span class="index num">{row.index + 1}</span>
        <div class="bar">
          <Meter
            value={row.fill}
            max={1}
            height="10px"
            theme="dark"
          />
          <span class="glyph">
            <AnchorGlyph state={row.isPlaced ? 'placed' : 'pending'} />
          </span>
        </div>
        <span class="state">{row.isPlaced ? 'down' : row.fill > 0 ? 'placing' : 'waiting'}</span>
        <span class={['bonus', 'num', { placed: row.isPlaced }]}>{bonus}</span>
      </div>
    {/each}
  </div>

  <dl>
    <div class="stat">
      <Label text="Anchors" />
      <span class="num">{f(harness.anchorsPlaced)} of {f(harness.anchorsAsked)}</span>
    </div>
    <div class="stat">
      <Label text="Anchor bonus" />
      <span class="num">×{multiplier.toFixed(2)}</span>
    </div>
    {#if carried < incarnating}
      <div class="stat">
        <Label text="Carried" />
        <span class="num">{f(carried)} of {f(incarnating)}</span>
      </div>
    {/if}
    <div class="stat">
      <Label text="Next anchor in" />
      <span class="num">{countdown}</span>
    </div>
  </dl>

  <p class="note">
    Held souls place the harness instead of incarnating, and the press buys time
    on it instead of experience. Every anchor down pays the souls that do
    incarnate — but only the cohorts on a line, and only as many of them as the
    harness can carry. Cancel and all of it comes out.
  </p>
</Section>

<style>
  .out {
    margin: 0;
    padding: var(--sp-3) 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    border-bottom: var(--rule-card);
  }

  .out .num {
    font-weight: 600;
    color: var(--ink-900);
  }

  .anchors {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
  }

  .row {
    display: grid;
    grid-template-columns: 1.5rem 1fr 4rem 3rem;
    align-items: center;
    gap: var(--sp-3);
  }

  .index {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .bar {
    position: relative;
    min-width: 0;
  }

  /* The anchor waiting at the run's end, driven in as its bar fills. */
  .glyph {
    position: absolute;
    top: 50%;
    right: 0;
    translate: 25% -50%;
    line-height: 0;
  }

  .state {
    font-size: var(--fs-sm);
    color: var(--ink-500);
    text-align: right;
  }

  /* Dim until it is paying. The row of them lighting up in turn is the reading. */
  .bonus {
    font-size: var(--fs-sm);
    color: var(--ink-200);
    text-align: right;
  }

  .bonus.placed {
    font-weight: 600;
    color: var(--ink-900);
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
