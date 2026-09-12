<script lang="ts">
  /**
   * The run's history, read from a button and nothing else.
   *
   * Its home is the action bar's right end. It floats in the card's own
   * bottom-right only before the bar exists — the log lands four beats ahead of
   * the header and beat one has nothing else to say — so both placements are
   * the same button in the same corner, and the bar arriving puts a floor under
   * it rather than moving it.
   *
   * The popover and the toast layer are `fixed` and measured off the trigger:
   * the bar clips (it reserves the body's scrollbar gutter), and a fixed box
   * escapes an `overflow: hidden` ancestor that is not also its containing
   * block. Nothing here transforms, so nothing here is.
   */
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { Label } from '$ui';
  import { log } from '$lib/log.svelte';
  import logIcon from '../assets/log-icon-light.svg';

  interface Props {
    /** Pegged to the card's bottom-right instead of sitting in the bar. The
        prelude's only home, so the caller must be a child of the card. */
    floating?: boolean;
  }

  let { floating = false }: Props = $props();

  let open = $state(false);
  let trigger: HTMLButtonElement | undefined = $state();
  let btnWidth = $state(0);

  /** Viewport insets of the trigger: right edge, top edge, bottom edge. */
  let right = $state(0);
  let above = $state(0);
  let below = $state(0);

  /**
   * Called before anything opens rather than watched: the button moves when the
   * bar arrives or the rail toggles, and neither is a resize.
   */
  function place() {
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const root = document.documentElement;
    right = root.clientWidth - rect.right;
    above = root.clientHeight - rect.top;
    below = root.clientHeight - rect.bottom;
  }

  function toggle() {
    place();
    open = !open;
  }

  $effect(place);

  /** Reveals pop beside the button as they land; open, the list already shows them. */
  let lastHighlightId = log.entries[0]?.id ?? 0;
  $effect(() => {
    const head = log.entries[0];
    if (!head || head.id <= lastHighlightId) return;

    lastHighlightId = head.id;
    if (open || !head.highlight) return;

    place();
    toast.push(head.text, { target: 'highlight', pausable: true });
  });
</script>

<svelte:window onresize={place} />

<div
  class={['log', { floating }]}
  style:--right="{right}px"
  style:--above="{above}px"
  style:--below="{below}px"
  style:--btn-w="{btnWidth}px"
>
  <button class="trigger" aria-label="Log" bind:this={trigger} bind:clientWidth={btnWidth} onclick={toggle}>
    <img src={logIcon} alt="" width="20" height="20" />
  </button>

  {#if open}
    <div class="popover">
      <Label text="Log" />
      <ol>
        {#each log.entries as entry (entry.id)}
          <li class={{ highlight: entry.highlight }}>{entry.text}</li>
        {/each}
      </ol>
    </div>
  {/if}

  <div class="highlight-toast">
    <SvelteToast target="highlight" options={{ intro: { x: 0, y: 24 } }} />
  </div>
</div>

<style>
  .log {
    display: flex;
    align-items: center;
  }

  /* The corner the action bar will hand it, at a screen's own inline inset.
     Absolute against the card, which is what makes it the *card's* corner —
     fixed, it drifted out to the window's edge and left the content behind. */
  .log.floating {
    position: absolute;
    right: var(--sp-4);
    bottom: var(--sp-4);
    z-index: 40;
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: var(--rule-card);
    padding: var(--sp-2);
  }

  /* Right edges flush with the trigger, opening upward off its top. */
  .popover {
    position: fixed;
    right: var(--right);
    bottom: calc(var(--above) + var(--sp-2));
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: 502px;
    border: var(--rule-card);
    background: var(--surface-alt);
    padding: var(--sp-3) var(--sp-4) var(--sp-4);
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    max-height: 108px;
    overflow-y: auto;
  }

  li {
    font-size: var(--fs-sm);
    line-height: 1.5;
    color: var(--ink-900);
  }

  li.highlight {
    font-weight: 600;
  }

  /* A second toast container, beside the button on the side it has room on:
     the default's centered translate doesn't apply here, and the message wants
     the log's bold treatment. */
  .highlight-toast {
    --toastContainerTop: auto;
    --toastContainerBottom: var(--below);
    --toastContainerLeft: auto;
    --toastContainerRight: calc(var(--right) + var(--btn-w) + var(--sp-2));
    --toastWidth: 300px;
    --toastMinHeight: auto;
    /* Top-only, so the bottommost toast's own edge lands exactly on
       --toastContainerBottom instead of the library's default bottom margin
       pushing it up half a rem short of the button's bottom. */
    --toastMargin: var(--sp-2) 0 0 0;
  }

  .highlight-toast :global(._toastItem) {
    translate: none;
  }

  .highlight-toast :global(._toastMsg) {
    font-weight: 600;
  }
</style>
