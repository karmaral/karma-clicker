<script lang="ts">
  /** The screen tabs — one button per screen, laid across the action bar's left. */
  import { Pip } from '$ui';
  import { nav } from '$lib/nav.svelte';
  import { SCREENS, SCREEN_LABELS } from '$lib/labels';
  import { catalogue } from './upgrades.svelte';

  const visible = $derived(SCREENS.filter((screen) => nav.state(screen) !== 'absent'));

  /** 1/2/3 follow `SCREENS`' own order — details, overview, refinery. */
  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    const screen = SCREENS[Number(event.key) - 1];
    if (screen && nav.isAvailable(screen)) nav.to(screen);
  }
</script>

<svelte:window {onkeydown} />

{#if visible.length > 1}
  <nav class="navbar" style:--tabs={visible.length}>
    {#each visible as screen (screen)}
      <button
        type="button"
        class={['item', { active: nav.active === screen }]}
        disabled={!nav.isAvailable(screen)}
        onclick={() => nav.to(screen)}
      >
        {SCREEN_LABELS[screen]}
        {#if nav.active !== screen}
          <Pip count={catalogue.affordable[screen]} label="upgrades to buy" />
        {/if}
      </button>
    {/each}
  </nav>
{/if}

<style>
  /* A tab is `--tab` wide whatever the count — the bar measures that off the
     body, and the strip is however many of it are showing, so two tabs span the
     planet column exactly and a third continues past the seam at the same
     width. Equal tracks rather than content widths, so a tab holds still as its
     pip comes and goes; the active tab never carries one. */
  .navbar {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    flex: none;
    width: calc(var(--tab) * var(--tabs));
    height: 100%;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    min-width: 0;
    border: unset;
    background: var(--surface);
    padding-inline: var(--sp-4);
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
    color: var(--ink-900);
    transition: background var(--t-fast), color var(--t-fast);
  }

  .item + .item {
    border-left: var(--rule-row);
  }

  .item:not(:disabled):hover {
    background: var(--res-xp);
    color: var(--ink-inverse);
  }

  .item.active {
    background: var(--ink-900);
    color: var(--ink-inverse);
  }

  .item:disabled {
    color: var(--ink-200);
  }
</style>
