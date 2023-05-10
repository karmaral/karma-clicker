<script lang="ts">
  import { formatNumber, multPow10 } from '$lib/utils';
  import { karma } from '$lib/resources';

  let magnitudeCounter = 1;
  let ceiling = multPow10(10, magnitudeCounter);

  $: value = $karma.amount;

  $: if (value >= ceiling - (ceiling * 0.15)) {
    magnitudeCounter += 1;
    ceiling = multPow10(10, magnitudeCounter);
  }

  function getBarWidth(val: number) {
    const width = val / ceiling * 100;
    return `${width}%`;
  }
  $: width = getBarWidth(value);

</script>

<div class="progress-bar">
  <div class="progress-fill" style:width></div>
  <span class="value">{formatNumber(value, false)} / {formatNumber(ceiling, false)}</span>
</div>

<style>
  .progress-bar {
    width: 100%;
    height: 2rem;
    border: 1px solid gainsboro;
    position: relative;
    margin-bottom: 1rem;
  }
  .progress-fill {
    height: 100%;
    max-width: 100%;
    position: absolute;
    left: 50%;
    transform: translate(-50%);
    background-color: #ccc;
  }
  span {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

</style>
