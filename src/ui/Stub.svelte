<script lang="ts">
  /** Holds a slot for a panel that is revealed but not built yet. */
  interface Props {
    name: string;
    note?: string;
    height?: string;
  }

  let { name, note, height = '96px' }: Props = $props();
</script>

<div class="stub" style:min-height={height}>
  <span class="name">{name}</span>
  {#if note}
    <span class="note">{note}</span>
  {/if}
</div>

<style>
  .stub {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--sp-1);
    padding: var(--sp-3);
    border: 1px dashed var(--line-300);
    background: repeating-linear-gradient(
      -45deg,
      transparent 0 6px,
      var(--surface-alt) 6px 12px
    );
    min-width: 0;
  }

  .name {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
    color: var(--ink-400);
  }

  .note {
    font-size: var(--fs-xs);
    color: var(--ink-300);
  }
</style>
