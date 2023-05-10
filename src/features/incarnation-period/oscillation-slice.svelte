<script lang="ts">
  import WaveSlot from './wave-slot.svelte';
  import { compoundScale } from '$lib/utils';
  import type { WaveSlotType } from '$lib/types';

  export let index: number;
  export let multiplier: number = .5;
  export let initialAmount = 10;

  const slots: WaveSlotType[] = ['high', 'mid', 'low', 'mid'];
  
  function calcMin(firstParent: boolean, firstSlot: boolean, times: number) {
    let t = times - 1;

    if (firstSlot) {
      if (firstParent) return 0;

      t--;
    }
    return compoundScale(initialAmount, t, multiplier);
  }

</script>

<div class="oscillation-slice">
  {#each slots as type, i}
    {@const times = i + 1}
    {@const firstParent = index === 0 }
    {@const firstSlot = i === 0 }
    {@const min = calcMin(firstParent, firstSlot, times)}
    {@const max = compoundScale(initialAmount, times, multiplier)}
    <WaveSlot {type} {min} {max} />
  {/each}
</div>


<style>
  .oscillation-slice {
    display: flex; 
    flex-grow: 1;
  }
</style>
