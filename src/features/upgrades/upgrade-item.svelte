<script lang="ts">
  import { onMount } from 'svelte';
  import { ResourceManager, UpgradeManager } from '$lib/managers';
  import type { UpgradeData } from '$lib/types';

  export let target: string;
  export let data: UpgradeData;

  let unlocked = false;
  let acquired = false;
  let canPurchase = false;

  function purchase() {
    const action = UpgradeManager.purchase(target, data.id);
    if (action) {
      acquired = true;
    }
  }

  onMount(() => {
    const { cost, cost_type, unlock_type, id } = data;
    const onTotalChanged = (detail) => {
      if (unlocked && acquired) {
        ResourceManager.removeListener(unlock_type, 'total', onTotalChanged);
        return;
      }

      if (!UpgradeManager.isLocked(target, id)) {
        unlocked = true;

        if (!('cost' in data)) {
          acquired = true;
          UpgradeManager.acquire(target, id);
        }
        return;
      }

      if (UpgradeManager.isAcquired(target, id)) {
        acquired = true;
      }
    };
    const onChanged = (detail) => {
      canPurchase = detail.amount >= cost;
    };
    ResourceManager.addListener(unlock_type, 'total', onTotalChanged);
    ResourceManager.addListener(cost_type, 'change', onChanged);

    // console.log({ listener, locked, acquired, target, id: data.id });
  });
</script>

<li class="item" 
  class:unlocked
  class:acquired
  data-type={target}
  data-unlocks-at={data.unlocks_at}
  data-unlock-type={data.unlock_type}
>
  <div class="item-content">
    <div class="item-header">
      <span class="title">{data.title}</span>
    </div>
    <div class="item-body">
      <p class="description">{data.description}</p>
      {#if !acquired}
        {#if 'cost' in data}
          <button on:click={purchase} disabled={!canPurchase}>
            Acquire
            <br>
            <span style:font-size=".8em">{data.cost} {data.cost_type}</span>
          </button>
        {/if}
      {/if}
    </div>
  </div>
</li>


<style>
  .item {
    display: flex;
    flex-direction: column;
    /* gap: 1.2em; */
    border: 1px solid hsl(0 0% 0% / 15%);
    padding: 1em;
    font-size: .7em;
    flex-grow: 1;
    flex-basis: calc(50% - var(--gap));
  }
  .item::before {
    content: attr(data-type);
    font-size: .9em;
    opacity: .7;
    text-transform: uppercase;
    text-align: right;
    line-height: 1;
  }
  .item::after {
    content: "Unlocked at " attr(data-unlocks-at) " " attr(data-unlock-type);
    font-size: .9em;
    opacity: .7;
    margin-top: 1em;
  }
  .item:not(.unlocked) {
    opacity: .5;
    pointer-events: none;
  }
  .item.acquired {
    background: hsl(0 0% 0% / 5%);
  }
  p {
    margin: 0;
  }
  .item-body {
    display: flex;
    flex-direction: column;
    gap: .3em;
  }
  .item-header {
    position: relative;
  }
  .title {
    font-size: 1.2em;
    font-weight: bolder;
  }
  .description {
    font-size: 1em;
    color: hsl(0 0% 0% / .8);
  }


</style>
