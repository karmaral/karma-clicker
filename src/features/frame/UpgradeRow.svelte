<script lang="ts">
  import { Badge, Label } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { getEffectLabel, getScopeLabel } from '$lib/labels';
  import type { ResourceType } from '$types';
  import type { Upgrade } from './upgrades.svelte';

  interface Props {
    upgrade: Upgrade;
    /** Omitted for an acquired row — nothing left to buy. */
    onclick?: () => void;
  }

  let { upgrade, onclick }: Props = $props();

  const scope = $derived(getScopeLabel(upgrade.target));
  const effect = $derived(getEffectLabel(upgrade.effect, upgrade.effectTarget));
  const costEntry = $derived(
    upgrade.costs ? Object.entries(upgrade.costs)[0] as [ResourceType, number] : undefined,
  );
</script>

{#snippet body()}
  <span class="scope"><Label text={scope} size="sm" /></span>
  <span class="ident">
    <span class="name">{upgrade.label}</span>
    {#if effect}<span class="effect">{effect}</span>{/if}
  </span>
  <span class="cost">
    {#if upgrade.acquired}
      <span class="dash">—</span>
    {:else if costEntry}
      <span class="num">{formatCost(costEntry[1])}</span>
      <Badge kind={badgeFor(costEntry[0])} />
    {:else}
      <span class="arrives">arrives</span>
    {/if}
  </span>
{/snippet}

{#if upgrade.acquired}
  <div class="row acquired">
    {@render body()}
  </div>
{:else}
  <button
    type="button"
    class={['row', upgrade.status]}
    disabled={upgrade.status === 'approaching' || upgrade.status === 'arriving'}
    {onclick}
  >
    {@render body()}
  </button>
{/if}

<style>
  .row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr) auto;
    align-items: baseline;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-2) 0;
    border-bottom: var(--rule-row);
    background: none;
    border-inline: none;
    border-top: none;
    text-align: left;
    color: var(--ink-500);
    transition: color var(--t-fast);
  }

  .scope { min-width: 0; }

  .ident {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .name {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--ink-900);
  }

  .effect {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .cost {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    justify-self: end;
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
  }

  .dash { color: var(--ink-200); }
  .arrives { font-size: var(--fs-xs); color: var(--ink-300); font-weight: 500; }

  .row.affordable {
    color: var(--ink-900);
    cursor: var(--cursor-rest);
  }
  .row.affordable:hover:not(:disabled) {
    color: var(--res-xp);
    & .name { color: var(--res-xp); }
  }

  .row.approaching,
  .row.arriving {
    color: var(--ink-200);
  }
  .row.approaching .name,
  .row.arriving .name {
    color: var(--ink-300);
  }
</style>
