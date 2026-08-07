<script lang="ts">
  import { Stub } from '$ui';
  import type { BadgeKind } from '$ui';
  import { BuildingManager, ResourceManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { formatNumber } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import type { ResourceType } from '$types';
  import Disc from '../Disc.svelte';
  import Log from '../Log.svelte';
  import ProbeTable from './ProbeTable.svelte';
  import type { Probe } from './types';
  import buildingData from '$data/buildings';
  import texts from '$data/buildings-texts';

  const CLICK = 'main_action';

  const click = $derived(BuildingManager.getBuilding(CLICK));
  const clickYield = $derived(click?.production[click.data.yield_type] ?? 0);

  const probeCount = $derived(
    BuildingManager.buildings.reduce((sum, id) => {
      const probe = BuildingManager.getBuilding(id);
      if (!probe || probe.data.role === 'click') return sum;

      return sum + probe.owned;
    }, 0),
  );

  function badgeFor(type: ResourceType): BadgeKind {
    if (type === 'experience') return 'xp';

    const [family, polarity] = type.split('_');
    if (family === 'karma') return polarity === 'negative' ? 'neg' : 'pos';

    return family as BadgeKind;
  }

  const probes = $derived.by(() => {
    const rows: Probe[] = [];
    for (const id of BuildingManager.buildings) {
      const data = buildingData[id];
      if (!data || data.role === 'click') continue;

      const probe = BuildingManager.getBuilding(id);
      if (!probe) continue;

      const cost = probe.getCost(1);
      const perSecond =
        (probe.production[data.yield_type] ?? 0) * probe.owned
        / ((probe.duration || 1000) / 1000);

      rows.push({
        id,
        count: formatNumber(probe.owned),
        name: texts[id]?.title ?? id,
        description: texts[id]?.description ?? '',
        aim: 0,
        lean: '',
        output: {
          kind: badgeFor(data.yield_type),
          amount: formatNumber(perSecond),
          unit: '/s',
        },
        cost: {
          kind: badgeFor(data.cost_type!),
          amount: formatNumber(cost),
          affordable: ResourceManager.getAmount(data.cost_type!) >= cost,
        },
      });
    }

    return rows;
  });

  function incarnate() {
    click?.queueAction();
  }

  function buy(id: string) {
    BuildingManager.purchase(id, 1);
    pulse();
  }
</script>

<div class="detail">
  <div class="read">
    <Disc
      count={probeCount}
      sub="+{formatNumber(clickYield)} experience"
      onincarnate={incarnate}
    />

    {#if progression.isRevealed('detail.wave')}
      <Stub name="detail.wave" note="the wave — Phase D" />
    {/if}

    <Log />
  </div>

  <div class="act">
    {#if progression.isRevealed('detail.probeTable')}
      <ProbeTable
        {probes}
        showAim={progression.isRevealed('detail.aimGlobal')}
        onbuy={buy}
      />
    {/if}

    {#if progression.isRevealed('detail.split')}
      <Stub name="detail.split" note="the probe split — Phase D" />
    {/if}
  </div>
</div>

<style>
  .detail {
    display: grid;
    grid-template-columns: 5fr 7fr;
    align-items: start;
    min-width: 0;
  }

  .read {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    padding: var(--sp-5) var(--sp-4);
    border-right: var(--rule-card);
    min-width: 0;
  }

  .act {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
