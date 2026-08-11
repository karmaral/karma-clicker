<script lang="ts">
  import { Badge, Chip, ChipQueue, Label } from '$ui';
  import type { ChipStatus } from '$ui';
  import { ResourceManager, UpgradeManager } from '$lib/managers';
  import type { ResourceType, YieldType } from '$types';
  import { pulse } from '$lib/loop';
  import { formatNumber as fmt } from '$lib/utils';
  import { badgeFor } from '$features/detail/badge';
  import data, { parseScope } from '$data/upgrades';
  import texts from '$data/upgrades-texts';

  const VISIBLE = 5;

  interface Upgrade {
    target: string;
    id: string;
    label: string;
    scope: string;
    costs?: Record<ResourceType, number>;
    status: ChipStatus;
    distanceToAffordable: number;
    textData: Record<string, string>;
  }

  function upgradeFor(target: string, id: string): Upgrade | undefined {
    if (UpgradeManager.isAcquired(target, id)) return;

    const item = data[target].find((u) => u.id === id);
    if (!item) return;

    const text = texts[target]?.[id];

    // The rail is where you buy things. Unpriced upgrades arrive on their own.
    if (!item.costs) return;

    const [cost_type, cost] = Object.entries(item.costs)[0] as [ResourceType, number];
    const locked = UpgradeManager.isLocked(target, id);
    const held = ResourceManager.getAmount(cost_type);

    let status: ChipStatus = 'unlocked';
    if (locked) {
      status = 'approaching';
    } else if (held >= cost) {
      status = 'affordable';
    }

    const { kind, entity } = parseScope(target);

    return {
      target,
      id,
      label: text?.title ?? id,
      scope: entity ?? kind,
      costs: item.costs as Record<ResourceType, number>,
      status,
      distanceToAffordable: cost - held,
      textData: { ...text },
    };
  }

  const upgrades = $derived.by(() => {
    const all: Upgrade[] = [];
    for (const target of Object.keys(data)) {
      for (const item of data[target]) {
        const upgrade = upgradeFor(target, item.id);
        if (upgrade) {
          all.push(upgrade);
        }
      }
    }

    return all.sort((a, b) => a.distanceToAffordable - b.distanceToAffordable);
  });

  const shown = $derived(upgrades.filter((u) => u.status !== 'approaching').slice(0, VISIBLE));
  const approaching = $derived(upgrades.length - shown.length);

  function buy(upgrade: Upgrade) {
    UpgradeManager.purchase(upgrade.target, upgrade.id);
    pulse();
  }
</script>

<div class="rail-upgrades">
  <div class="head">
    <Label text="Upgrades" />
    <span class="caption">{approaching} more coming</span>
  </div>
  <ChipQueue escape="all {upgrades.length} →">
    {#each shown as upgrade (upgrade.target + upgrade.id)}
      <Chip
        label={upgrade.label}
        costs={upgrade.costs}
        status={upgrade.status}
        onclick={() => buy(upgrade)}
      >
        {#snippet caption()}
          <span class="scope">{upgrade.scope}</span>
          ·
          <span class="effect">{upgrade.effect || ''}</span>
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
                  <strong><span>{fmt(costVal)}</span></strong>
                  <Badge kind={badgeFor(costType as YieldType)} />
                {/each}
              {/if}
            </p>
          </div>
          {upgrade.label}
        {/snippet}
      </Chip>
    {/each}
    {#if approaching > 0}
      <Chip 
        label="{approaching} approaching" 
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
