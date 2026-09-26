<script lang="ts">
  /**
   * The frame's modal window. No portal: mounted as a root sibling of `main`
   * (see App.svelte) so the page behind it can go `inert` without this needing
   * to inert itself. Its body is a row of `DialogColumn`s.
   */
  import type { Snippet } from 'svelte';
  import { catalogue } from './upgrades.svelte';

  interface Props {
    title: string;
    note?: Snippet;
    /** Grid tracks for the columns. */
    columns?: string;
    children: Snippet;
  }

  let { title, note, columns = 'minmax(0, 3fr) minmax(0, 2fr)', children }: Props = $props();

  let panel: HTMLDivElement | undefined = $state();

  function close() {
    catalogue.close();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }

  // Whatever had focus — the button that opened it — gets it back on the way out.
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
    aria-label={title}
    onpointerdown={(event) => event.stopPropagation()}
  >
    <div class="head">
      <span class="title">{title}</span>
      {#if note}
        <span class="note">{@render note()}</span>
      {/if}
      <button type="button" class="escape" onclick={close}>ESC ✕</button>
    </div>

    <div class="body" style:grid-template-columns={columns}>
      {@render children()}
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
    box-shadow: var(--shadow-float);
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

  .note {
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
    min-height: 0;
    overflow: hidden;
  }
</style>
