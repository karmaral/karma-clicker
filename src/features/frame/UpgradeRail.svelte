<script lang="ts">
  import { Badge, Chip, ChipQueue, Label } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import CohortTooltip from '$features/details/CohortTooltip.svelte';
  import { BuildingManager } from '$lib/managers';
  import { getEffectLabel, getScopeLabel } from '$lib/labels';
  import { iconFor } from './upgrade-icon';
  import { nav } from '$lib/nav.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import type { YieldType } from '$types';
  import { catalogue, type Upgrade } from './upgrades.svelte';

  /**
   * This screen's, and the global ones. A chip is about the thing under it: the
   * rail's hover lights its target on the screen below, and a chip pointing two
   * tabs away was lighting nothing. What is cut out is not lost — the action
   * bar's tabs carry the count of what is buyable behind each of them.
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

  /**
   * The row a chip's second panel would be about — the cohort it names, and only
   * where there is something to price. A verb carries no modifiers, so an unlock
   * never opens a panel of zeroes for a row that does not exist yet; a fan-out
   * names no one row and falls out on the scope.
   */
  function cohortFor(upgrade: Upgrade) {
    if (upgrade.kind !== 'cohort' || !upgrade.entity) return;
    if (!upgrade.modifiers.length) return;

    return BuildingManager.getBuilding(upgrade.entity);
  }
</script>

<div class="rail-upgrades">
  <div class="head">
    <Label text="Upgrades" />
    <button type="button" class="escape" onclick={catalogue.open}>all {total} →</button>
  </div>
  <ChipQueue>
    {#each here as upgrade (upgrade.target + upgrade.id)}
      {@const cohort = cohortFor(upgrade)}

      <!-- What the chip's own panel cannot say: the row it lands on, priced as if
           it were already bought. The same panel the roster draws, so the figure
           promised here is the figure the row will read. Declared out here and
           passed by name — a snippet inside the tag is a prop whether or not
           there is a row for it, and the chip opens a second box for one. -->
      {#snippet asidePanel()}
        <CohortTooltip cohort={cohort!} extra={upgrade.modifiers} />
      {/snippet}

      <Chip
        label={getScopeLabel(upgrade.target)}
        icon={iconFor(upgrade)}
        status={upgrade.status}
        onclick={() => buy(upgrade)}
        onmouseenter={() => spotlight.point(upgrade.target)}
        onmouseleave={() => spotlight.clear()}
        asideContent={cohort ? asidePanel : undefined}
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

  /* Title and price on one line while the panel has room, price dropping to its
     own line when it does not. The `2ch` was doing the wrap's job by force: it
     held the two apart at any width, so at the narrower panel the title broke
     mid-word instead of the pair breaking at the seam between them. A gap and a
     wrap say the same thing without setting a floor. */
  .item-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-1) var(--sp-3);
  }

  .title {
    font-weight: 600;
    min-width: 0;
  }

  /* Its own margin rather than `space-between`, so it stays right-aligned on the
     wrapped line too, where it is the only thing on it. A price never breaks. */
  .cost {
    font-weight: 600;
    margin-left: auto;
    white-space: nowrap;
  }
</style>
