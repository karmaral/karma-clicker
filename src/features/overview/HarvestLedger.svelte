<script lang="ts">
  /** What everything behind you still sends. Empty until a world is left for good. */
  import { Badge, Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { f } from '$lib/utils';
  import { badgeFor } from '../detail/badge';
  import planetTexts from '$data/planets-texts';
  import type { ResourceType } from '$types';

  interface Rate {
    type: ResourceType;
    perSecond: number;
  }

  function ratesOf(id: string): Rate[] {
    const { yields, duration } = PlanetManager.getPlanet(id).data;
    if (!yields || !duration) return [];

    const seconds = duration / 1000;

    return (Object.keys(yields) as ResourceType[]).map((type) => ({
      type,
      perSecond: (yields[type] ?? 0) / seconds,
    }));
  }

  const rows = $derived(
    PlanetManager.behind.map((id) => ({
      id,
      name: planetTexts[id]?.title ?? id,
      rates: ratesOf(id),
    })),
  );

  /** One line per resource, however many worlds contribute to it. */
  const total = $derived.by(() => {
    const summed = new Map<ResourceType, number>();
    for (const row of rows) {
      for (const rate of row.rates) {
        summed.set(rate.type, (summed.get(rate.type) ?? 0) + rate.perSecond);
      }
    }

    return [...summed].map(([type, perSecond]) => ({ type, perSecond }));
  });
</script>

<Section label="Harvest">
  {#if rows.length}
    <ul class="worlds">
      {#each rows as row (row.id)}
        <li class="world">
          <span class="name">{row.name}</span>
          <span class="rates">
            {#each row.rates as rate (rate.type)}
              <span class="rate">
                <Badge kind={badgeFor(rate.type)} />
                <span class="num">{f(rate.perSecond)}/s</span>
              </span>
            {:else}
              <span class="none">nothing yet</span>
            {/each}
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
