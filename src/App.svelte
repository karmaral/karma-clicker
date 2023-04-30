<script lang="ts">
  import { ResourcesInfo } from '$features';
  import IncarnationCycle from '$features/incarnation-period';
  import MainAction from '$features/main-action.svelte';
  import UpgradesWidget from '$features/upgrades';
  import BuildingsWidget from '$features/buildings';
  import { BuildingManager } from '$lib/managers';
  BuildingManager.unlock('main_action');
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet">
</svelte:head>

<header>
  <h1>Karma Clicker</h1>
  <ResourcesInfo />
</header>
<main>
  <div class="container">
    <MainAction />
    <BuildingsWidget />
    <UpgradesWidget />
  </div>
</main>
<footer>
  <IncarnationCycle />
</footer>

<style>
  h1 {
    font-size: 1em;
  }
  header, main, footer {
    display: flex;
    flex-direction: column;
    padding: 1em;
    align-items: center;
  }
  main {
    flex-grow: 1;
    justify-content: flex-start;
  }
  footer {
    flex-direction: row;
  }
  .container {
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
  }
</style>
