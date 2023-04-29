<script lang="ts">
  import UpgradeItem from './upgrade-item.svelte';
  import upgradeData from '$data/upgrades';
  
  const upgradeKeys = Object.keys(upgradeData);

</script>

<div class="unlocks">
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
  .unlocks {
    display: flex;
    flex-direction: column;
  }
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    gap: .5em;
    flex-direction: column;
      list-style: none;
  }
  .separator {
    margin-block: .3em;
    height: 1px;
    background-color: gainsboro;
  }
</style>
