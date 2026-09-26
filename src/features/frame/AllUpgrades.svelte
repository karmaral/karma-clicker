<script lang="ts">
  /** The rail's overflow window — every bucket, available beside acquired. */
  import { PlanetManager } from '$lib/managers';
  import planetTexts from '$data/planets-texts';
  import { catalogue } from './upgrades.svelte';
  import Dialog from './Dialog.svelte';
  import DialogColumn from './DialogColumn.svelte';
  import UpgradeRow from './UpgradeRow.svelte';

  let showLocked = $state(false);

  const planet = $derived(PlanetManager.getActive());
  const planetName = $derived(planet ? planetTexts[planet.id]?.title ?? planet.id : undefined);

  const isEmpty = $derived(catalogue.available.length === 0 && catalogue.locked.length === 0);
</script>

<Dialog title="All upgrades">
  {#snippet note()}
    {catalogue.acquired.length} acquired · {catalogue.available.length} available
    {#if planetName}
      — {planetName}
    {/if}
  {/snippet}

  <DialogColumn label="Available" note="nearest to affordable first">
    {#if isEmpty}
      <p class="empty">nothing yet</p>
    {:else}
      {#each catalogue.available as upgrade (upgrade.target + upgrade.id)}
        <UpgradeRow {upgrade} onclick={() => catalogue.buy(upgrade)} />
      {/each}

      {#if catalogue.locked.length > 0}
        {#if showLocked}
          {#each catalogue.locked as upgrade (upgrade.target + upgrade.id)}
            <UpgradeRow {upgrade} />
          {/each}
        {:else}
          <button type="button" class="fold" onclick={() => (showLocked = true)}>
            {catalogue.locked.length} further out ↓
          </button>
        {/if}
      {/if}
    {/if}
  </DialogColumn>

  <DialogColumn label="Acquired" note="newest first">
    {#if catalogue.acquired.length === 0}
      <p class="empty">nothing yet</p>
    {:else}
      {#each catalogue.acquired as upgrade (upgrade.target + upgrade.id)}
        <UpgradeRow {upgrade} />
      {/each}
    {/if}
  </DialogColumn>
</Dialog>

<style>
  .fold {
    padding: var(--sp-3) 0;
    background: none;
    border: none;
    text-align: left;
    font-size: var(--fs-sm);
    font-weight: 600;
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
    color: var(--ink-300);
  }
  .fold:hover { color: var(--ink-500); }
</style>
