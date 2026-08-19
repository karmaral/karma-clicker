<script lang="ts">
  /** What everything behind you still sends. Empty until a world is left for good. */
  import { Badge, Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { f, formatClock } from '$lib/utils';
  import { badgeFor } from '../detail/badge';
  import planetTexts from '$data/planets-texts';
  import type Planet from '$lib/planets/base.svelte';
  import type { ResourceType } from '$types';

  const TICK_MS = 1000;

  /**
   * Local, and written only by the timer — never read and written in the same
   * effect, which is what a shared store must not do.
   */
  let now = $state(Date.now());

  $effect(() => {
    const handle = setInterval(() => (now = Date.now()), TICK_MS);

    return () => clearInterval(handle);
  });

  const rows = $derived(
    PlanetManager.behind.map((id) => {
      const planet = PlanetManager.getPlanet(id);
      const yields = planet.harvestYields;

      return {
        id,
        planet,
        name: planetTexts[id]?.title ?? id,
        deliveries: (Object.keys(yields) as ResourceType[])
          .map((type) => ({ type, amount: yields[type] ?? 0 })),
      };
    }),
  );

  /**
   * The only rate on the panel. Batches do not add — every world's duration
   * moves with its own merged count — so a total has to be per second.
   */
  const total = $derived.by(() => {
    const summed = new Map<ResourceType, number>();

    for (const row of rows) {
      // A 0 duration is a world that pays once, so there is no rate to divide out.
      const seconds = row.planet.harvestDuration / 1000;
      if (!seconds) continue;

      for (const { type, amount } of row.deliveries) {
        summed.set(type, (summed.get(type) ?? 0) + amount / seconds);
      }
    }

    return [...summed].map(([type, perSecond]) => ({ type, perSecond }));
  });

  /** Blank rather than 00:00 on a world that pays once and has nothing pending. */
  function countdownOf(planet: Planet) {
    const nextAt = planet.emitter?.nextAt ?? 0;
    if (!nextAt || !planet.harvestDuration) return '';

    return formatClock(nextAt - now);
  }
</script>

<Section label="Harvest">
  {#if rows.length}
    <ul class="worlds">
      {#each rows as row (row.id)}
        {@const countdown = countdownOf(row.planet)}
        <li class="world">
          <span class="name">{row.name}</span>
          <span class="rates">
            {#each row.deliveries as delivery (delivery.type)}
              <span class="rate">
                <Badge kind={badgeFor(delivery.type)} />
                <span class="num">{f(delivery.amount)}/y</span>
              </span>
            {:else}
              <span class="none">nothing yet</span>
            {/each}
            {#if countdown}
              <span class="clock">{countdown}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>

    {#if total.length > 1 || rows.length > 1}
      <div class="total">
        <span class="name">Total</span>
        <span class="rates">
          {#each total as rate (rate.type)}
            <span class="rate">
              <Badge kind={badgeFor(rate.type)} />
              <span class="num">{f(rate.perSecond)}/s</span>
            </span>
          {/each}
        </span>
      </div>
    {/if}
  {:else}
    <p class="empty">Nothing is behind you yet.</p>
  {/if}
</Section>

<style>
  .worlds {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .world,
  .total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: var(--sp-2);
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .total {
    border-bottom: none;
    border-top: var(--rule-card);
  }

  .name {
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }

  .total .name {
    font-weight: 600;
    color: var(--ink-900);
  }

  .rates {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-1) var(--sp-3);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .clock {
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .none,
  .empty {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .empty {
    margin: 0;
    padding: var(--sp-3) var(--sp-2);
  }
</style>
