<script lang="ts">
  import { Cell, Figure, Label, Meter } from '$ui';

  interface Polarity {
    amount: string;
    rate: string;
    bar: number;
  }

  interface Props {
    negative: Polarity;
    positive: Polarity;
    banded?: boolean;
  }

  let { negative, positive, banded = false }: Props = $props();
</script>

<Cell label="Karma" {banded}>
  {#snippet header()}
    <div class="split">
      <span class="polarity neg"><Label text="Negative" size="default" /></span>
      <span class="polarity pos"><Label text="Positive" size="default" /></span>
    </div>
  {/snippet}

  <div class="split body">
    <div class="head neg">
      <Figure value={negative.amount} />
      <span class="rate num">{negative.rate}</span>
    </div>

    <span class="axis" aria-hidden="true"></span>

    <div class="head pos">
      <Figure value={positive.amount} />
      <span class="rate num">{positive.rate}</span>
    </div>

    <div class="bar neg">
      <Meter value={negative.bar} fill="neg" align="end" height="15px" track={false} />
    </div>
    <div class="bar pos">
      <Meter value={positive.bar} fill="pos" height="15px" track={false} />
    </div>
  </div>
</Cell>

<style>
  .split {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    column-gap: var(--sp-3);
    row-gap: var(--sp-2);
    width: 100%;
    min-width: 0;
  }

  .split > .neg { grid-column: 1; justify-self: end; }
  .split > .pos { grid-column: 3; justify-self: start; }

  .polarity {
    display: flex;
    line-height: 1;
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    grid-row: 1;
  }

  .rate {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-500);
    line-height: 1;
  }

  .bar { grid-row: 2; min-width: 0; }
  .bar.neg { justify-self: stretch; }
  .bar.pos { justify-self: stretch; }

  .axis {
    position: relative;
    grid-area: 1 / 2 / 3 / 3;
    background: var(--ink-900);
  }

  .axis::before,
  .axis::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 9px;
    height: 1px;
    margin-left: -4.5px;
    background: var(--ink-900);
  }

  .axis::before { top: 0; }
  .axis::after { bottom: 0; }
</style>
