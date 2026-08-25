<script lang="ts">
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { Label } from '$ui';
  import { log } from '$lib/log.svelte';
  import logIcon from '../assets/log-icon-light.svg';

  let open = $state(false);
  let btnWidth = $state(0);

  /** Reveals pop beside the button as they land; open, the list already shows them. */
  let lastHighlightId = log.entries[0]?.id ?? 0;
  $effect(() => {
    const head = log.entries[0];
    if (!head || head.id <= lastHighlightId) return;

    lastHighlightId = head.id;
    if (!open && head.highlight) toast.push(head.text, { target: 'highlight', pausable: true });
  });
</script>

<div style:--btn-w="{btnWidth}px">
  <div class="anchor">
    <button class="trigger" aria-label="Log" bind:clientWidth={btnWidth} onclick={() => (open = !open)}>
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
  </div>

  <div class="highlight-toast">
    <SvelteToast target="highlight" options={{ intro: { x: 0, y: 24 } }} />
  </div>
</div>

<style>
  .anchor {
    position: fixed;
    left: var(--sp-4);
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

  .popover {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: var(--sp-2);
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

  /* A second toast container, beside the button: the default's centered
     translate doesn't apply here, and the message wants the log's bold treatment. */
  .highlight-toast {
    --toastContainerTop: auto;
    --toastContainerBottom: var(--sp-4);
    --toastContainerLeft: calc(var(--sp-4) + var(--btn-w) + var(--sp-2));
    --toastContainerRight: auto;
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