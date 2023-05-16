<script lang="ts">
  import planetData from '$data/planets';
  import OscillationSlice from './oscillation-slice.svelte';
  import { compoundScale } from '$lib/utils';
  import { PlanetManager } from '$lib/managers';

  export let id: string;
  let data = planetData[id];

</script>

{#if data}
  <div class="planetary-period">
    <div class="container">
      {#each Array(data.cycles_per_age) as _, i (`s${i}`) }
        {@const num = (i * 4) + 1}
        {@const mult = data.cycle_stage_multiplier}
        {@const initial = compoundScale(data.cycle_initial_stage_amount, num, mult)}
        <OscillationSlice 
          initialAmount={initial}
          multiplier={data.cycle_stage_multiplier}
          index={i}
        />
      {/each}
    </div>
  </div>
{/if}
<style>
  .planetary-period {
    height: 10em;
    border: 1px solid hsl(0 0% 0% / 15%);
  }
  .container {
    display: flex;
    height: 100%;
  }

</style>
