<script lang="ts">
  import { PlanetManager } from '$lib/managers';
  import PlanetItem from './planet-item.svelte';
  import planetData from '$data/planets';
  import texts from '$data/planets-texts';


  const planets = Object.keys(planetData);
</script>

<div class="planet-list">
  <div class="container">
    {#each planets as id (id)}
      {@const textData = texts[id]}
      {@const planet = PlanetManager.getPlanet(id)}
      <PlanetItem {id} {planet} {textData} />
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
  }
</style>
