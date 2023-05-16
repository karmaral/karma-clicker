<script lang="ts">
  import { PlanetManager } from '$lib/managers';
  import PlanetList from '$features/planets/planet-list.svelte';
  import IncarnationWidget from '$features/planets/incarnation-widget.svelte';

  $: ({ inspecting } = $PlanetManager);


</script>

<div class="planets-widget">
  {#if inspecting}
    <IncarnationWidget />
  {:else}
    <div class="planets">
      <h4 style:text-align="center">Planets</h4>
      <PlanetList />
    </div>
  {/if}
</div>

<style>
  h4 { font-size: .9em; }
</style>
