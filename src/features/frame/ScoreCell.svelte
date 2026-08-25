<script lang="ts">
  import { Cell, Value } from '$ui';

  interface Props {
    amount: string;
    rate?: string;
    caption?: string;
  }

  let { amount, rate, caption }: Props = $props();
</script>

<div class="score">
  <Cell label="Experience" {caption} banded>
    <Value kind="xp" value={amount} {rate} />
  </Cell>
</div>

<style>
  .score {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    position: relative;
    background: var(--surface-alt);
    min-width: 0;
  }

  .score::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: -1px;
    width: 1px;
    background: var(--line-300);
  }
</style>
