<script lang="ts">
  import { Label } from '$ui';
  import type { Stage } from './types';

  interface Props {
    stages: Stage[];
    current: number;
  }

  let { stages, current }: Props = $props();
</script>

<div class="strip" style:grid-template-columns="repeat({stages.length}, 1fr)">
  {#each stages as stage, i (stage.at)}
    <div class={['cell', stage.kind, { current: i === current }]}>
      <span class="kind"><Label text={stage.kind} size="sm" /></span>
      <span class="at num">{stage.at}</span>
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
