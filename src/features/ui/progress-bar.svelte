<script lang="ts">
  import { formatNumber, multPow10 } from '$lib/utils';

  export let negative: number;
  export let positive: number;
  export let absolute = false;
  export let label = true;

  let magnitudeCounter = 1;
  let ceiling = multPow10(10, magnitudeCounter);

  $: total = negative + positive;

  $: if (total >= ceiling - (ceiling * 0.15)) {
    magnitudeCounter += 1;
    ceiling = multPow10(10, magnitudeCounter);
  }

  function getBarWidth(val: number, max: number) {
    const width = val / max * 100;
    return `${width}%`;
  }
  $: width = getBarWidth(total, ceiling);
  $: negWidth = getBarWidth(negative, total);
  $: posWidth = getBarWidth(positive, total);

</script>

<div class="progress-bar" class:absolute>
  <div class="progress-fill" style:width={absolute ? '100%' : width}>
    <div class="negative" style:width={negWidth}></div>
    <div class="positive" style:width={posWidth}></div>
  </div>
  {#if label}
    <span class="value">{formatNumber(total, 2)} / {formatNumber(ceiling, 2)}</span>
  {/if}
</div>

<style>
  .progress-bar {
    width: 100%;
    height: 2rem;
    border: 1px solid gainsboro;
    position: relative;
  }
  .progress-fill {
    display: flex;
    height: 100%;
    max-width: 100%;
    position: absolute;
    left: 50%;
    transform: translate(-50%);
    background-color: #ccc;
    padding: .1em;
  }
  .negative {
    height: 100%;
    background: var(--negative-fill, hsl(0 0% 0% / 40%));
  }
  .positive {
    height: 100%;
    background: var(--positive-fill, hsl(0 0% 100% / 50%));
  }
  span {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

</style>
