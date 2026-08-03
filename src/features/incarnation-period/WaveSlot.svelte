<script lang="ts">
  import { negKarma, posKarma } from '$lib/resources';
  import { formatNumber, withinRange } from '$lib/utils';
  import type { WaveSlotType } from '$lib/types';

  export let type: WaveSlotType = 'high';
  export let min: number;
  export let max: number;

  function calcProgress(current: number) {
    if (min > current) return 0;
    if (current >= max) return 100;

    const progress = (current - min) / (max - min) * 100;
    return progress % 100;
  }
  $: karma = $negKarma.total + $posKarma.total

  $: progress = calcProgress(karma);
  $: active = withinRange(karma, min, max);

  $: labelMin = formatNumber(min);
  $: labelMax = formatNumber(max);

  $: small = labelMin.length > 6;
  

</script>

<div 
  class="wave-slot {type}"
  class:active
  style:--progress={progress}
>
  <div class="point-wrap">
    <div class="point"></div>
  </div>
  <div class="progress-counter">
    <div class="progress-bar"></div>
    <span class:small class="min">{labelMin}</span>
    <span class:small class="max">{labelMax}</span>
  </div>
  
</div>

<style>
  .wave-slot {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    position: relative;
    padding-block: 2em;
    border-right: 1px solid hsl(0 0% 0% / .3);
  }
  :global(.oscillation-slice:last-child) .wave-slot:last-child {
    border: none;
  }
  .wave-slot.mid {
    align-items: center;
  }
  .wave-slot.low {
    align-items: flex-end;
  }
  .point-wrap {
    position: relative;
  }
  .point {
    height: 1em;
    width: 1em;
    border-radius: 50%;
    border: 2px solid hsl(0 0% 0% / 15%);
  }
  .active .point {
    background: hsl(0 0% 0% / 50%);
  }
  .progress-counter {
    width: 100%;
    height: 100%;
    background: hsl(0 0% 0% / 15%);
    display: flex;
    align-items: flex-end;
    position: absolute;
    left: 0;
    bottom: 0;
  }
  .progress-bar {
    height: calc(var(--progress) * 1%);
    background: black;
    width: 100%;
    opacity: .2;
  } 
  .progress-counter span {
    position: absolute;
    text-align: center;
    width: 100%;
    font-size: .8em;
    line-height: 1;
  }
  .min {
    bottom: .5em;
  }
  .max {
    top: .5em;
  }
  
  .progress-counter .small {
    font-size: .7em;
  }

</style>
