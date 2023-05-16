<script lang="ts">
  import UpgradeItem from './upgrade-item.svelte';
  import upgradeData from '$data/upgrades';
  import texts from '$data/upgrades-texts';
  import { UpgradeManager } from '$lib/managers';
  
  const upgradeKeys = Object.keys(upgradeData);

</script>

<div class="widget upgrades-widget">
  <div class="container">
    <h4 style:text-align="center">Upgrades</h4>
    <ul>
      {#each upgradeKeys as target, i (target)}
        {#each upgradeData[target] as data (`${target}_${data.id}`)}
          {#if !$UpgradeManager.upgrades[target].includes(data.id)}
            {@const textData = texts[target][data.id]}
            <UpgradeItem {target} {data} {textData} />
          {/if}
        {/each}
      {/each}
    </ul>

  </div>
</div>

<style>
  .upgrades-widget {
    display: flex;
    flex-direction: column;
  }
  h4 { font-size: .9em; }
  ul {
    --gap: .5em;
    margin: 0;
    padding: 0;
    display: flex;
    gap: var(--gap);
    flex-direction: row;
    justify-content: center;
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
