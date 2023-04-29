<script lang="ts">
  import WaveSlot from './wave-slot.svelte';
  import { compoundScale } from '$lib/utils';

  export let multiplier: number = .5;
  export let initialAmount = 10;

  const slots = ['high', 'mid', 'low', 'mid'];
  

</script>

<div class="oscillation-slice">
  {#each slots as s, i}
    {@const min = i ? compoundScale(initialAmount, i, multiplier) : 0}
    {@const max = compoundScale(initialAmount, i + 1, multiplier)}
    <WaveSlot type={s} {min} {max} />
  {/each}
</div>


<style>
  .oscillation-slice {
    display: flex; 
    flex-grow: 1;
  }
</style>
