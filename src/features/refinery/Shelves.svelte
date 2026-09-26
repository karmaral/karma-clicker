<script lang="ts">
  /**
   * The knowledge shelves — see `docs/design.md` §18. Opened from the
   * refinery's learning split. This run's shelf first: it is spent against the
   * run you are in.
   */
  import { ResourceManager } from '$lib/managers';
  import { f } from '$lib/utils';
  import { catalogue } from '$features/frame/upgrades.svelte';
  import Dialog from '$features/frame/Dialog.svelte';
  import DialogColumn from '$features/frame/DialogColumn.svelte';
  import UpgradeRow from '$features/frame/UpgradeRow.svelte';

  const shelves = [
    { name: 'run', label: 'This run', note: 'gone at prestige' },
    { name: 'kept', label: 'Kept', note: 'survives prestige' },
  ] as const;
</script>

<Dialog title="Knowledge" columns="repeat(2, minmax(0, 1fr))">
  {#snippet note()}
    {f(ResourceManager.getAmount('knowledge'))} held
  {/snippet}

  {#each shelves as shelf (shelf.name)}
    <DialogColumn label={shelf.label} note={shelf.note}>
      {#each catalogue.shelf(shelf.name) as upgrade (`${upgrade.target}/${upgrade.id}`)}
        <UpgradeRow
          {upgrade}
          onclick={upgrade.acquired ? undefined : () => catalogue.buy(upgrade)}
        />
      {/each}
    </DialogColumn>
  {/each}
</Dialog>
