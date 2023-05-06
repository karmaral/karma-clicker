<script lang="ts">
  import WaveSlot from './wave-slot.svelte';
  import { compoundScale } from '$lib/utils';
  import type { WaveSlotType } from '$lib/types';

  export let index: number;
  export let multiplier: number = .5;
  export let initialAmount = 10;

  const slots: WaveSlotType[] = ['high', 'mid', 'low', 'mid'];

</script>

<div class="oscillation-slice">
  {#each slots as type, i}
    {@const times = (i + 1) * (index + 1) }
    {@const firstParent = index === 0 }
    {@const firstSlot = i === 0 }
    {@const min = (firstParent && firstSlot) ? 0 : compoundScale(initialAmount, (i * index), multiplier)}
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
