<script lang="ts">
  import { onMount } from 'svelte';
  import { ResourceManager, UpgradeManager, TooltipManager } from '$lib/managers';
  import { formatNumber as f, getUpgradeTypeLabel } from '$lib/utils';
  import { InfoTooltip } from '$features/ui';
  import type { UpgradeData, ItemTextData } from '$types';
  import type { Instance } from 'tippy.js';

  export let target: string;
  export let data: UpgradeData;
  export let textData: ItemTextData;

  let unlocked = false;
  let acquired = false;
  let canPurchase = false;

  $: label = getUpgradeTypeLabel(data?.id);
  $: type = label.toLowerCase();

  let triggerElem: HTMLButtonElement;
  let contentElem: HTMLDivElement; 
  let ttInstance: Instance;

  function purchase() {
    const action = UpgradeManager.purchase(target, data.id);
    if (action) {
      acquired = true;
      TooltipManager.removeInstance(ttInstance);
    }
  }

  onMount(() => {
    ttInstance = TooltipManager.addInstance(triggerElem, contentElem);

    const { cost, cost_type, unlock_type, id } = data;
    const onTotalChanged = (_detail: Record<string, number>) => {
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
    const onChanged = (detail: Record<string, number>) => {
      canPurchase = detail.amount >= cost;
    };
    
    ResourceManager.addListener(unlock_type, 'total', onTotalChanged);
    if (cost_type) {
      ResourceManager.addListener(cost_type, 'change', onChanged);
    }
  });
</script>

<li class="item {type}" 
  class:unlocked
  class:acquired
  class:disabled={!canPurchase}
>
  <button 
    on:click={purchase} 
    bind:this={triggerElem}
    data-tippy
  >
    {label.substring(0,2)}
  </button>

  <InfoTooltip bind:contentElem>
    <div class="tooltip-content"
      data-type="{label} - {target}"
      data-unlocks-at={f(data.unlocks_at)}
      data-unlock-type={data.unlock_type}
    >
      <div class="item-header">
        <span class="title">{textData.title}</span>
      </div>
      <div class="item-body">
        <p class="description">{textData.description}</p>
        {#if !acquired}
          {#if 'cost' in data}
            <p class="cost">
             Cost: <strong><span>{f(data.cost)} {data.cost_type}</span></strong>
            </p>
          {/if}
        {/if}
      </div>
    </div>
  </InfoTooltip>
</li>

<style>
  .item:not(.unlocked) > button {
    opacity: .5;
  }
  .item.acquired {
    background: hsl(0 0% 0% / 5%);
  }
  .item.disabled > button {
    border-color: hsl(0 0% 0% / 25%);
    border-style: dashed;
    animation: fadePop .7s;
  }
  .item:not(.disabled) {
    --pop-intensity: 1.05;
    animation: pop .5s;
  }
  .item:not(.unlocked) {
    animation: pop .7s;
  }
  @keyframes pop {
    from { transform: scale(var(--pop-intensity, 1.1)); }
    to { transform: scale(1); }
  }
  @keyframes fadePop {
    from { opacity: .6; }
    to { opacity: 1; }
  }

  .item > button {
    border: 1px solid hsl(0 0% 0% / 35%);
    width: 2.5em;
    aspect-ratio: 1;
    font-weight: bold;
    cursor: pointer;
  }
  .item:global(.blueprint) > button {
    background-color: hsl(0 0% 0% / 80%);
    border-color: hsl(0 0% 70% / 35%);
    color: white;
    font-weight: 500;
    border-radius: 50%;
  }
  .item:global(.core) > button {
    border-radius: 40%;
  }
  .item:global(.enhancement) > button {
    border-radius: .2em;
  }

  .tooltip-content {
    font-size: .7em;
  }

  .tooltip-content::before {
    content: attr(data-type);
    font-size: .8em;
    font-weight: 500;
    opacity: .7;
    text-transform: uppercase;
    display: block;
    line-height: 1;
    margin-bottom: 1em;
  }

  .tooltip-content::after {
    content: "Unlocked at " attr(data-unlocks-at) " " attr(data-unlock-type);
    font-size: .9em;
    opacity: .7;
    margin-top: 1em;
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
  .item.disabled .cost span {
    opacity: .7;
  }


</style>
