<script lang="ts">
  import { onMount } from 'svelte';
  import { ResourceManager, BuildingManager } from '$lib/managers';

  const id = 'main_action';

  $: building = BuildingManager.getBuilding(id);
  $: unitYield = $building.production[building.data.yield_type];


  function addExperience() {
    building.queueAction();
  }

  onMount(() => {
    const listener = (detail) => {
      ResourceManager.add('karma', detail.added / 3);
      // could have a passThrough = true arg that skips the multiplier effects
    };
    ResourceManager.addListener('experience', 'add', listener);
  });
</script>


<div class="main-action-widget">
  <div class="container">
    <button class="planet" on:click={addExperience}>
      Incarnate
      <span>{unitYield} xp</span>
    </button>
  </div>
</div>

<style>
  .main-action-widget {
    flex-grow: 1;
  }
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  button {
    border: unset;
    border-radius: 50%;
    padding: 3em;
    aspect-ratio: 1;
    cursor: pointer;
    font-weight: bold;
    transition: all 0s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: hsl(0 0% 12%);
    color: white;
  }
  button:active {
    background: hsl(0 0% 20%);
    box-shadow:
      inset 0 1em 1em 0 hsl(0 0% 0% / 10%),
      0 0 0 5px hsl(0 0% 50%);
    transition: box-shadow .13s ease-out;
  }

</style>
