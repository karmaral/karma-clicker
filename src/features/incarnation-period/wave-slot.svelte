<script lang="ts">
  import { karma } from '$lib/resources';
  import { ProgressRing } from '$features/ui';
  import { numberFormat, withinRange } from '$lib/utils';

  export let type: 'low' | 'mid' | 'high' = 'high';
  export let min: number;
  export let max: number;

  function calcProgress(current: number) {
    if (min > current) return 0;
    if (current >= max) return 100;

    const progress = (current - min) / (max - min) * 100;
    return progress % 100;
  }
  $: progress = calcProgress($karma.total);

  $: active = withinRange($karma.total, min, max);

</script>

<div 
  class="period-slot {type}"
  class:active
  style:--progress={progress}
>
  <div class="point-wrap">
    <div class="point"></div>
  </div>
  <div class="progress-counter">
    <div class="progress-bar"></div>
    <span>{numberFormat.format(max)}</span>
  </div>
  
</div>

<style>
  .period-slot {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    position: relative;
  }
  .period-slot.mid {
    align-items: center;
  }
  .period-slot.low {
    align-items: flex-end;
  }
  .active .point {
    box-shadow: 0 0 2px 2px black;
  }
  .point-wrap {
    position: relative;
  }
  .point {
    background: hsl(0 0% 0% / 50%);
    height: 1em;
    width: 1em;
    border-radius: 50%;
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
    bottom: .5em;
    text-align: center;
    width: 100%;
    font-size: .8em;
    line-height: 1;
  }

</style>
