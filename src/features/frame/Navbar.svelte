<script lang="ts">
  /** The screen tabs — one button per screen, laid across the action bar's left. */
  import { Pip } from '$ui';
  import { nav } from '$lib/nav.svelte';
  import { SCREENS, SCREEN_LABELS } from '$lib/labels';
  import { catalogue } from './upgrades.svelte';

  const visible = $derived(SCREENS.filter((screen) => nav.state(screen) !== 'absent'));

  /**
   * Harness' slot is the second one whether or not Harness is there yet: until
   * it reveals, Details stands across both. So the strip is a slot wider than it
   * has tabs, and the day Harness lands it fills a cell that already existed —
   * Overview and Refinery never move.
   */
  const spread = $derived(!visible.includes('harness'));

  const slots = $derived(visible.length + (spread ? 1 : 0));

  /** 1/2/3/4 follow `SCREENS`' own order, which is the slot order — so a number
      names the slot you are looking at, and 2 is dead while Details spans it. */
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
  <nav class="navbar" style:--tabs={slots}>
    {#each visible as screen (screen)}
      <button
        type="button"
        class={['item', { active: nav.active === screen, wide: spread && screen === 'details' }]}
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

  /* Details holding Harness' slot as well as its own. It is one tab across two
     tracks and not a wider track, so the strip's width is the same `--tab`
     arithmetic either way and nothing reflows when Harness lands. */
  .item.wide {
    grid-column: span 2;
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
