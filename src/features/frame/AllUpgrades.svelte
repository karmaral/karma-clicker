<script lang="ts">
  /**
   * The rail's overflow window — the first modal in the codebase. No portal, no
   * generic Overlay: one caller, twenty lines of mechanics. Mounted as a root
   * sibling of `main` (see App.svelte) so the page behind it can go `inert`
   * without this needing to inert itself.
   */
  import { Label } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import planetTexts from '$data/planets-texts';
  import { catalogue } from './upgrades.svelte';
  import UpgradeRow from './UpgradeRow.svelte';

  let panel: HTMLDivElement | undefined = $state();
  let showLocked = $state(false);

  const planet = $derived(PlanetManager.getActive());
  const planetName = $derived(planet ? planetTexts[planet.id]?.title ?? planet.id : undefined);

  const isEmpty = $derived(catalogue.available.length === 0 && catalogue.locked.length === 0);

  function close() {
    catalogue.close();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }

  // Whatever had focus — the rail's escape button — gets it back on the way out.
  let returnFocus: HTMLElement | null = null;

  $effect(() => {
    returnFocus = document.activeElement as HTMLElement | null;
    panel?.focus();

    return () => returnFocus?.focus();
  });
</script>

<svelte:window {onkeydown} />

<div class="backdrop" role="presentation" onpointerdown={close}>
  <div
    class="panel"
    bind:this={panel}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="All upgrades"
    onpointerdown={(event) => event.stopPropagation()}
  >
    <div class="head">
      <span class="title">All upgrades</span>
      <span class="note">
        {catalogue.acquired.length} acquired · {catalogue.available.length} available
        {#if planetName}
          — {planetName}
        {/if}
      </span>
      <button type="button" class="escape" onclick={close}>ESC ✕</button>
    </div>

    <div class="body">
      <section class="column">
        <div class="col-head">
          <Label text="Available" />
          <span class="note">nearest to affordable first</span>
        </div>
        <div class="rows">
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
        </div>
      </section>

      <section class="column">
        <div class="col-head">
          <Label text="Acquired" />
          <span class="note">newest first</span>
        </div>
        <div class="rows">
          {#if catalogue.acquired.length === 0}
            <p class="empty">nothing yet</p>
          {:else}
            {#each catalogue.acquired as upgrade (upgrade.target + upgrade.id)}
              <UpgradeRow {upgrade} />
            {/each}
          {/if}
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50; /* above the fixed furniture at 40 (Log, DevPanel, LabRail); below tippy's 9999 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-5);
    background: rgba(255, 255, 255, .72);
  }

  .panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1400px;
    max-height: 86svh;
    background: var(--surface);
    border: var(--rule-card);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .10);
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--sp-4) var(--sp-3);
    border-bottom: var(--rule-strong);
  }

  .title {
    font-size: var(--fs-lg);
    font-weight: 600;
    letter-spacing: -.01em;
    color: var(--ink-900);
  }

  .head .note {
    color: var(--ink-500);
  }

  .escape {
    margin-left: auto;
    flex: none;
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-400);
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
  }
  .escape:hover { color: var(--ink-900); }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    min-height: 0;
    overflow: hidden;
  }

  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: var(--sp-4);
  }

  .column + .column {
    border-left: var(--rule-row);
  }

  .col-head {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    padding-bottom: var(--sp-2);
    border-bottom: var(--rule-section);
    min-width: 0;
  }

  .col-head .note {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .rows {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin-top: var(--sp-2);
  }

  .empty {
    padding: var(--sp-3) 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

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
