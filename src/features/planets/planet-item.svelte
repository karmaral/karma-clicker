<script lang="ts">
  import { onMount } from 'svelte';
  import type Planet from '$lib/planets/base';
  import type { ItemTextData } from '$types';
  import { PlanetManager, TooltipManager } from '$lib/managers';
  import { InfoTooltip } from '$features/ui';
  import type { Instance } from 'tippy.js';

  export let id: string;
  export let planet: Planet;
  export let textData: ItemTextData;

  $: selected = $PlanetManager.selected === id;
  $: locked = !$PlanetManager.planets.includes(id);

  $: experience = $planet?.experience || 0;

  function handleInspect() {
    if (locked) return;
    PlanetManager.setActive(id);
    ttInstance.hide();
  }

  let triggerElem: HTMLButtonElement;
  let contentElem: HTMLDivElement;
  let ttInstance: Instance

  onMount(() => {
    ttInstance = TooltipManager.addInstance(triggerElem, contentElem);
  });

</script>

<div class="planet-item">
  <button 
    class="planet" 
    class:selected
    class:locked
    on:click={handleInspect}
    data-tippy
    bind:this={triggerElem}
  ></button>

  <InfoTooltip bind:contentElem >
    <div class="tooltip-content">
      <h4>{textData.title}</h4>
      {textData.description}
      <p class="experience">
        {experience} total planet experience
      </p>
      <p class="">
        Densities: -
      </p>
      {#if locked}
        <p style="font-size: .9em; opacity: .7">Locked</p>
      {/if}
    </div>
  </InfoTooltip>
</div>

<style>
  .planet-item {
    display: flex;
    flex: 1 0;
    justify-content: center;
    width: 5rem;
    height: 10rem;
    padding: 3rem;
    border: 1px dashed hsl(0 0% 0% / 10%);
  }
  .planet-item:not(:first-child) {
    border-left: none;
  }
  .planet {
    background-color: hsl(0 0% 0% / 50%);
    border-radius: 50%;
    aspect-ratio: 1;
    cursor: pointer;
    border: none;
    padding: none;
    position: relative;
  }
  .planet.selected {
    outline: 3px solid hsl(0 0% 0% / 70%);
  }
  .planet.selected::after {
    content: "active";
    text-transform: uppercase;
    position: absolute;
    font-size: .7em;
    font-weight: bold;
    bottom: -2.5em;
    left: 50%;
    transform: translate(-50%);
  }
  .planet.locked {
    background: hsl(0 0% 0% / 5%);
    border: 3px dotted hsl(0 0% 0% / 15%);
  }
  .tooltip-content {
    max-width: 12rem;
    font-size: .8em;
  }
  p {
    font-size: .9em;
  }
  .experience {
    opacity: .8;
  }
</style>
