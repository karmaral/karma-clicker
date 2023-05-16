<script lang="ts">
  import { ResourcesInfo } from '$features';
  import IncarnationCycle from '$features/incarnation-period';
  import MainAction from '$features/main-action.svelte';
  import UpgradesWidget from '$features/upgrades';
  import BuildingsWidget from '$features/buildings';
  import { BuildingManager } from '$lib/managers';
  import RefineryWidget from '$features/refinery';
  import { SvelteToast } from '@zerodevx/svelte-toast';

  BuildingManager.unlock('main_action');

</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet">
</svelte:head>

<header>
  <ResourcesInfo />
  <SvelteToast />
</header>
<main>
  <div class="container">
    <div class="incarnation">
      <MainAction />
      <IncarnationCycle />
    </div>

    <div class="wrapper">
      <UpgradesWidget />
      <BuildingsWidget />
    </div>
  </div>
   <RefineryWidget /> 
</main>
<footer>
</footer>

<style>
  header, main, footer {
    display: flex;
    flex-direction: column;
    padding: 1em;
    align-items: center;
    width: 80%
  }
  main {
    flex-grow: 1;
    justify-content: flex-start;
    width: 80%;
    position: relative;
    overflow: hidden;
  }
  .container {
    display: flex;
    justify-content: center;
    gap: 5em;
    flex-wrap: wrap;
    height: 100%;
    width: 100%;
  }
  .container > :global(div) {
    display: flex;
    flex-direction: column;
    flex-basis: calc(33% - 1em);
    height: 100%;
  }
  .wrapper {
    flex-grow: 1;
    display: flex;
    gap: 1em;
    flex-direction: column;
  }
  footer {
    flex-direction: row;
    width: 80%
  }
</style>
