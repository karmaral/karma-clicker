<script lang="ts">
  import BuildingItem from './building-item.svelte';
  import { BuildingManager } from '$lib/managers';
  import texts from '$data/buildings-texts';

  $: buildings = $BuildingManager.buildings.filter(b => b !== 'main_action');

</script>

<div class="buildings-widget">
  <div class="container">
    <h4 style:text-align="center">Buildings</h4>
    {#each buildings as id (id)}
      {@const building = BuildingManager.getBuilding(id)}
      {@const textData = texts[id]}
      <BuildingItem {building} {id} {textData} />
    {:else}
      <p>No buildings available yet.</p>
    {/each }
  </div>
</div>

<style>
  .buildings-widget {
    overflow-y: auto;
  }
  .container {
    display: flex;
    flex-wrap: wrap;
    min-width: 30em;
    gap: 1em;
  }
  h4 {
    font-size: .9em;
    padding-block: .5em;
    flex-basis: 100%;
    position: sticky;
    top: 0;
    background: white;
  }
  .container :global(.item) {
    flex-basis: calc(50% - 1em);
  }
  .container p {
    text-align: center;
    font-size: .8em;
    opacity: .7;
    flex-grow: 1;
  }
</style>
