<script lang="ts">
  import { Badge, Chip, ChipQueue, Label } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { getEffectLabel, getScopeLabel } from '$lib/labels';
  import { iconFor } from './upgrade-icon';
  import { nav } from '$lib/nav.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import type { YieldType } from '$types';
  import { catalogue, type Upgrade } from './upgrades.svelte';

  /**
   * This screen's, and the global ones. A chip is about the thing under it: the
   * rail's hover lights its target on the screen below, and a chip pointing two
   * tabs away was lighting nothing. What is cut out is not lost — the header's
   * tabs carry the count of what is buyable behind each of them.
   *
   * The column is tall rather than wide, so all of it shows — no `VISIBLE` cap,
   * the queue itself scrolls past the fold.
   */
  const here = $derived(catalogue.onScreen(nav.active));

  /** The window is every bucket, so its own count is the one on the way out. */
  const total = $derived(catalogue.available.length);

  function buy(upgrade: Upgrade) {
    catalogue.buy(upgrade);
  }
</script>

<div class="rail-upgrades">
  <div class="head">
    <Label text="Upgrades" />
    <button type="button" class="escape" onclick={catalogue.open}>all {total} →</button>
  </div>
  <ChipQueue>
    {#each here as upgrade (upgrade.target + upgrade.id)}
      <Chip
        label={getScopeLabel(upgrade.target)}
        icon={iconFor(upgrade)}
        status={upgrade.status}
        onclick={() => buy(upgrade)}
        onmouseenter={() => spotlight.point(upgrade.target)}
        onmouseleave={() => spotlight.clear()}
      >
        {#snippet tooltipContent()}
          <div class="item-header">
            <span class="title">{upgrade.textData.title}</span>

            <span class="cost num">
              {#if upgrade.costs}
                {#each Object.entries(upgrade.costs) as [costType, costVal]}
                  <span>{formatCost(costVal)}</span>
                  <Badge kind={badgeFor(costType as YieldType)} />
                {/each}
              {/if}
            </span>
          </div>

          <div class="item-body">
            <p class="effect">{getEffectLabel(upgrade.effect, upgrade.effectTarget)}</p>
            <p class="description">{upgrade.textData.description}</p>
          </div>
        {/snippet}
      </Chip>
    {/each}
  </ChipQueue>
</div>

<style>
  .rail-upgrades {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    flex: 1;
    min-height: 0;
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    flex: none;
  }

  .escape {
    flex: none;
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    border-bottom: 1px solid var(--ink-900);
    white-space: nowrap;
  }

  .escape:hover {
    color: var(--ink-500);
    border-bottom-color: var(--ink-500);
  }

  .item-header {
    display: flex;
    justify-content: space-between;

  }
  .title {
    font-weight: 600;
    margin-right: 2ch;
  }
  .cost {
    font-weight: 600;
    margin-left: auto;
  }
</style>
