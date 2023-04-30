<script lang="ts">
  import UpgradeItem from './upgrade-item.svelte';
  import upgradeData from '$data/upgrades';
  
  const upgradeKeys = Object.keys(upgradeData);

</script>

<div class="upgrades-widget">
  <div class="container">
    <ul>
      {#each upgradeKeys as target, i (target)}
        {#each upgradeData[target] as data (data.id)}
          <UpgradeItem {data} {target} />
        {/each}
        {#if i < upgradeKeys.length - 1} 
          <li class="separator"></li>
        {/if}
      {/each}
    </ul>

  </div>
</div>

<style>
  .upgrades-widget {
    display: flex;
    flex-direction: column;
  }
  ul {
    --gap: .5em;
    margin: 0;
    padding: 0;
    display: flex;
    gap: var(--gap);
    flex-direction: row;
    flex-wrap: wrap;
    list-style: none;
  }
  .separator {
    margin-block: 1em;
    height: 1px;
    background-color: gainsboro;
    flex-basis: 100%
  }
</style>
