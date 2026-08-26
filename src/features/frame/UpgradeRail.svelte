<script lang="ts">
  import { Badge, Chip, ChipQueue, Label } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { getEffectLabel, getScopeLabel } from '$lib/labels';
  import type { YieldType } from '$types';
  import { catalogue, type Upgrade } from './upgrades.svelte';

  const VISIBLE = 5;

  const shown = $derived(catalogue.available.slice(0, VISIBLE));
  const overflow = $derived(catalogue.available.length - shown.length);

  function buy(upgrade: Upgrade) {
    catalogue.buy(upgrade);
  }
</script>

<div class="rail-upgrades">
  <div class="head">
    <Label text="Upgrades" />
    <span class="caption">{overflow} more coming</span>
  </div>
  <ChipQueue escape="all {catalogue.available.length} →" onescape={catalogue.open}>
    {#each shown as upgrade (upgrade.target + upgrade.id)}
      <Chip
        label={upgrade.label}
        costs={upgrade.costs}
        status={upgrade.status}
        onclick={() => buy(upgrade)}
      >
        {#snippet caption()}
          <span class="scope">{getScopeLabel(upgrade.target)}</span>
          ·
          <span class="effect">{getEffectLabel(upgrade.effect, upgrade.effectTarget)}</span>
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
