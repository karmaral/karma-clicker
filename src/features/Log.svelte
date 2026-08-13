<script lang="ts">
  import { Label } from '$ui';
  import { log } from '$lib/log.svelte';
</script>

<div class="log">
  <Label text="Log" />
  <ol>
    {#each log.entries as entry (entry.id)}
      <li>{entry.text}</li>
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
    padding: var(--sp-2) 0;
    border-bottom: var(--rule-row);
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }

  li:last-child {
    border-bottom: none;
  }
</style>
