<script lang="ts">
  import { Chip, ChipQueue, Label } from '$ui';
  import type { ChipState } from '$ui';
  import { ResourceManager, UpgradeManager } from '$lib/managers';
  import { pulse } from '$lib/loop';
  import { formatNumber } from '$lib/utils';
  import data from '$data/upgrades';
  import texts from '$data/upgrades-texts';

  const VISIBLE = 5;

  interface Upgrade {
    target: string;
    id: string;
    label: string;
    cost?: string;
    state: ChipState;
    /** How far from affordable, for sorting. */
    distance: number;
  }

  function upgradeFor(target: string, id: string): Upgrade | undefined {
    if (UpgradeManager.isAcquired(target, id)) return;

    const item = data[target].find((u) => u.id === id);
    if (!item) return;

    const { cost, cost_type } = item;
    const locked = UpgradeManager.isLocked(target, id);
    const held = cost_type ? ResourceManager.getAmount(cost_type) : 0;

    let state: ChipState = 'unlocked';
    if (locked) {
      state = 'approaching';
    } else if (cost && held >= cost) {
      state = 'affordable';
    }

    return {
      target,
      id,
      label: texts[target]?.[id]?.title ?? id,
      cost: cost ? `${formatNumber(cost)} ${cost_type?.split('_')[0]}` : undefined,
      state,
      distance: cost ? cost - held : 0,
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

    return all.sort((a, b) => a.distance - b.distance);
  });

  const shown = $derived(upgrades.filter((u) => u.state !== 'approaching').slice(0, VISIBLE));
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
        cost={upgrade.cost}
        state={upgrade.state}
        onclick={() => buy(upgrade)}
      />
    {/each}
    {#if approaching > 0}
      <Chip label="{approaching} approaching" state="approaching" disabled />
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
