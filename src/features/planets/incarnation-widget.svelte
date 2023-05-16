<script lang="ts">
  import IncarnationCycle from '$features/incarnation-period';
  import MainAction from '$features/main-action.svelte';
  import { PlanetManager } from '$lib/managers';
  import type { ItemTextData } from '$lib/types';
  import texts from '$data/planets-texts';

  $: id = $PlanetManager.selected;

  let textData: ItemTextData;
  $: if (id) {
    textData = texts[id];
  }

  function handleViewPlanets() {
    PlanetManager.setInspecting(false);
  }

</script>

<div class="incarnation-widget">
  <div class="header">
    <h4 style:text-align="center">{textData?.title}</h4>
    <span>{textData?.description}</span>
  </div>
  <button 
    class="planets-btn" 
    on:click={handleViewPlanets}
  >
    All Planets
  </button>
  <MainAction />
  <IncarnationCycle {id} />
</div>


<style>
  .incarnation-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .header {
    text-align: center;
  }
  .header > span {
    font-size: .8em;
    color: hsl(0 0% 0% / 70%);
  }

  .planets-btn {
    position: absolute;
    right: 0;
    text-transform: uppercase;
    font-size: .6em;
    font-weight: 600;
    padding: 1em;
    background: unset;
    border: 1px solid hsl(0 0% 0% / 15%);
  }
</style>
