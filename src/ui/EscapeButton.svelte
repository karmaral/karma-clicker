<script lang="ts">
  /** Same mark and weight as the upgrade popup's own escape — bound to the
   * literal key too, so a takeover closes the way that panel already does. */
  interface Props {
    onclose?: () => void;
  }

  let { onclose }: Props = $props();

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onclose?.();
  }
</script>

<svelte:window {onkeydown} />

<button type="button" class="escape" onclick={() => onclose?.()}>ESC ✕</button>

<style>
  .escape {
    position: absolute;
    top: 0;
    right: 0;
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-400);
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
  }

  .escape:hover {
    color: var(--ink-900);
  }
</style>
