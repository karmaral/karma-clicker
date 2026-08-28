<script lang="ts">
  import { Badge, Chip, ChipQueue, Label } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { getUpgradeReading } from '$lib/labels';
  import { nav } from '$lib/nav.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import type { YieldType } from '$types';
  import { catalogue, type Upgrade } from './upgrades.svelte';

  const VISIBLE = 5;

  /** The chip's own line — short, and the authored one where there is one. */
  const readingOf = (upgrade: Upgrade) =>
    getUpgradeReading(upgrade.target, upgrade.effect, upgrade.effectTarget, upgrade.textData.effect);

  /**
   * This screen's, and the global ones. A chip is about the thing under it: the
   * rail's hover lights its target on the screen below, and a chip pointing two
   * tabs away was lighting nothing. What is cut out is not lost — the header's
   * tabs carry the count of what is buyable behind each of them.
   */
  const here = $derived(catalogue.onScreen(nav.active));

  const shown = $derived(here.slice(0, VISIBLE));
  const overflow = $derived(here.length - shown.length);

  /** The window is every bucket, so its own count is the one on the way out. */
  const total = $derived(catalogue.available.length);

  function buy(upgrade: Upgrade) {
    catalogue.buy(upgrade);
  }
</script>

<div class="rail-upgrades">
  <div class="head">
    <Label text="Upgrades" />
    <span class="caption">{nav.label(nav.active).toLowerCase()} · {overflow} more coming</span>
  </div>
  <ChipQueue escape="all {total} →" onescape={catalogue.open}>
    {#each shown as upgrade (upgrade.target + upgrade.id)}
      <Chip
        label={upgrade.label}
        costs={upgrade.costs}
        status={upgrade.status}
        onclick={() => buy(upgrade)}
        onmouseenter={() => spotlight.point(upgrade.target)}
        onmouseleave={() => spotlight.clear()}
      >
        {#snippet caption()}
          {@const reading = readingOf(upgrade)}
          <span class="scope">{reading.scope}</span>
          ·
          <span class="effect">{reading.effect}</span>
        {/snippet}

        {#snippet tooltipContent()}
          <div class="item-header">
            <span class="title">{upgrade.textData.title}</span>
          </div>
          <div class="item-body">
            <p class="description">{upgrade.textData.description}</p>
            <p class="cost">
              Cost:
              {#if upgrade.costs}
                {#each Object.entries(upgrade.costs) as [costType, costVal]}
                  <strong><span>{formatCost(costVal)}</span></strong>
                  <Badge kind={badgeFor(costType as YieldType)} />
                {/each}
              {/if}
            </p>
          </div>
          {upgrade.label}
        {/snippet}
      </Chip>
    {/each}
    {#if overflow > 0}
      <Chip
        label="{overflow} more"
        status="approaching"
        disabled
      />
    {/if}
  </ChipQueue>
</div>

<style>
  .rail-upgrades {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    flex: 1;
    min-width: 0;
  }

  .scope {
    color: var(--ink-300);
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    flex: none;
  }

  .caption {
    font-size: var(--fs-xs);
    color: var(--ink-300);
  }
</style>
