<script lang="ts">
  import { Label } from '$ui';
  import { log, elapsed } from '$lib/log.svelte';
</script>

<div class="log">
  <Label text="Log" />
  <ol>
    {#each log.entries as entry (entry.id)}
      <li>
        <span class="at num">{elapsed(entry.at)}</span>
        <span class="text">{entry.text}</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  .log {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
    overflow: hidden;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    max-height: 168px;
    overflow-y: auto;
  }

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sp-3);
    padding: var(--sp-2) 0;
    border-bottom: var(--rule-row);
    font-size: var(--fs-sm);
  }

  li:last-child {
    border-bottom: none;
  }

  .at {
    color: var(--ink-300);
  }

  .text {
    color: var(--ink-700);
  }
</style>
