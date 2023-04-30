<script lang="ts">
  import BuildingItem from './building-item.svelte';
  import { BuildingManager } from '$lib/managers';
  import textData from '$data/texts';

  $: buildings = $BuildingManager.buildings.filter(b => b !== 'main_action');

</script>

<div class="entities-widget">
  <div class="container">
    {#each buildings as id (id)}
      {@const building = BuildingManager.getBuilding(id)}
      <BuildingItem {building} textData={textData[id]} {id} />
    {:else}
      <p>No buildings available yet.</p>
    {/each }
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: .3em;
    min-width: 30em;
  }
  .container p {
    text-align: center;
    font-size: .8em;
    opacity: .7;
  }
</style>
