<script lang="ts">
  import { Label } from '$ui';
  import type { Phase } from './types';

  interface Props {
    phases: Phase[];
    current: number;
  }

  let { phases, current }: Props = $props();
</script>

<div class="strip" style:grid-template-columns="repeat({phases.length}, 1fr)">
  {#each phases as phase, i (i)}
    <div class={['cell', phase.kind, { current: i === current }]}>
      <span class="kind"><Label text={phase.kind} size="sm" /></span>
      <span class="at num">{phase.at}</span>
    </div>
  {/each}
</div>

<style>
  .strip {
    display: grid;
    width: 100%;
    min-width: 0;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    padding: var(--sp-2);
    border-left: var(--rule-row);
    min-width: 0;
  }

  .cell:first-child {
    border-left: none;
  }

  .cell.dense {
    background: hsl(0 0% 7% / .035);
  }

  .cell.current {
    background: hsl(0 0% 7% / .07);
  }

  .at {
    font-size: var(--fs-xs);
    color: var(--ink-300);
    line-height: 1;
  }

  .cell.current .at {
    color: var(--ink-500);
  }
</style>
