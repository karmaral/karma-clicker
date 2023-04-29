<script lang="ts">
  import { ResourcesInfo } from '$features';

  import BuildingsWidget from '$features/buildings';
</script>

<header>
  <h1>Karma Clicker</h1>
  <ResourcesInfo />

</header>
<main>
  <div class="container">
    <BuildingsWidget />
  </div>
</main>
<footer>
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
