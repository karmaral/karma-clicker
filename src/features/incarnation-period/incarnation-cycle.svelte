<script lang="ts">
  import { karma } from '$lib/resources';
  import planetData from '$data/planets';
  import OscillationSlice from "./oscillation-slice.svelte";
  import { compoundScale } from '$lib/utils';

  const data = planetData['first'];

</script>

<div class="planetary-period">
  <div class="container">
    {#each Array(data.cycles_per_age) as c, i }
      <OscillationSlice 
        initialAmount={compoundScale(data.initial_amount, i * 4 + 1, data.stage_amount_multiplier)}
        multiplier={data.stage_amount_multiplier}
      />
    {/each}
  </div>
</div>

<style>
  .planetary-period {
    flex-basis: 100%;
    height: 18em;
    border: 1px solid hsl(0 0% 0% / 15%);
  }
  .container {
    display: flex;
    height: 100%;
    padding: 2rem;
  }

</style>
