<script lang="ts">
  import { karma } from '$lib/resources';
  import planetData from '$data/planets';
  import OscillationSlice from './oscillation-slice.svelte';
  import WaveSlot from './wave-slot.svelte';
  import { compoundScale } from '$lib/utils';

  const data = planetData['first'];

</script>

<div class="planetary-period">
  <div class="container">
    {#each Array(data.cycles_per_age) as _, i (`s${i}`) }
      {@const num = (i * 4) + 1}
      {@const mult = data.stage_amount_multiplier}
      {@const initial = compoundScale(data.initial_amount, num, mult)}
      <OscillationSlice 
        initialAmount={initial}
        multiplier={data.stage_amount_multiplier}
        index={i}
      />
    {/each}
  </div>
</div>

<style>
  .planetary-period {
    height: 18em;
    border: 1px solid hsl(0 0% 0% / 15%);
  }
  .container {
    display: flex;
    height: 100%;
  }

</style>
