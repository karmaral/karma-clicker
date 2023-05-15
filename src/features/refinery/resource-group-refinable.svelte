<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { ResourceManager } from '$lib/managers';
  import type { CombinedResourceType, ResourceType } from '$types';
  import { ResourceQuantity } from '$features/ui';
  import type PolarizedResource from '$lib/resources/polarized';
  import { formatNumber, numberFormat } from '$lib/utils';
  import texts from '$data/resources-texts';
  import CurrencySymbol from '$features/ui/currency-symbol.svelte';

  export let type: CombinedResourceType;
  export let buyMode: number | 'max'; 


  let typeNeg = `${type}_negative` as ResourceType;
  let typePos = `${type}_positive` as ResourceType;

  let label = texts[type].title;

  let negKarma = ResourceManager.getResource('karma_negative') as PolarizedResource;
  let posKarma = ResourceManager.getResource('karma_positive') as PolarizedResource;

  let negative = ResourceManager.getResource(typeNeg) as PolarizedResource;
  let positive = ResourceManager.getResource(typePos) as PolarizedResource;
  let combined = ResourceManager.getCombinedTotal(type, true) as Readable<number>;

  const fontSize = '1.5em';
  const symbolFontSize = '1.1em';

  function calcBuyMode(resource: PolarizedResource, mode: typeof buyMode, _karma: PolarizedResource): number { 
    const t = resource.type; 
    switch (mode) {
      case 'max':
       return ResourceManager.getAffordableConversionQuantity(t) || 1;
      default:
        return mode;
    }
  }
  $: buyModeCountNeg = calcBuyMode(negative, buyMode, $negKarma);
  $: buyModeCountPos = calcBuyMode(positive, buyMode, $posKarma); 
  $: activeCostNeg = ResourceManager.getConversionCost(type, buyModeCountNeg);
  $: activeCostPos = ResourceManager.getConversionCost(type, buyModeCountPos);

  function calcCanAfford(resource: PolarizedResource, amount: number) {
    return ResourceManager.has(resource.type, amount);
  }
  $: canAffordNeg = calcCanAfford($negKarma, activeCostNeg);
  $: canAffordPos = calcCanAfford($posKarma, activeCostPos);


  function handleConvert(targetType: ResourceType, amount: number) { 
    ResourceManager.convert(targetType, amount); 
  } 
</script>

<div class="group {type}">
  <h5>
    {label}
  </h5>
  <div class="wrapper">

    <button 
      class="btn-purchase"
      on:click={() => handleConvert(typeNeg, buyModeCountNeg)}
      disabled={!canAffordNeg}
    >
      <ResourceQuantity amount={$negative.amount} name="negative" {fontSize} />
    </button>

    {#if type === 'red'}
      <CurrencySymbol 
        letter="ϱ" 
        fontSize={symbolFontSize} 
        offset={['0px', '.1em']}
        bgColor="var(--red)"
      />
    {:else if type === 'yellow'}
      <CurrencySymbol 
        letter="ɣ" 
        fontSize={symbolFontSize} 
        offset={['0px', '.15em']}
        bgColor="var(--yellow)"
      />
    {:else if type === 'blue'}
      <CurrencySymbol 
        letter="ϐ" 
        fontSize={symbolFontSize} 
        offset={['0px', '.3em']}
        bgColor="var(--blue)"
      />
    {/if}

    <button 
      class="btn-purchase"
      on:click={() => handleConvert(typePos, buyModeCountPos)}
      disabled={!canAffordPos}
    >
      <ResourceQuantity amount={$positive.amount} name="positive" {fontSize} />
    </button>
  </div>

  <ResourceQuantity 
    amount={$combined} 
    name="total" 
    layout="horizontal" 
    fontSize=".8em" 
  />

  <span class="cost" class:max={buyMode === 'max'}>
    {#if buyMode === 'max'}
      {numberFormat.format(buyModeCountNeg)} x <strong>{formatNumber(activeCostNeg)}</strong> karma | 
      {numberFormat.format(buyModeCountPos)} x <strong>{formatNumber(activeCostPos)}</strong> karma
    {:else}
      {numberFormat.format(buyModeCountPos)} x <strong>{formatNumber(activeCostPos)}</strong> karma
    {/if}
  </span>
</div>

<style>
  .group {
    padding: 1em;
    flex-grow: 1;
    flex-basis: 33%;
  }
  .wrapper {
    display: flex;
    gap: 1em;
  }
  .btn-purchase {
    background: unset;
    font-size: 1em;
    cursor: pointer;
    border: 1px solid gainsboro;
    border-radius: .3em;
    flex-grow: 1;
  }
  h5 {
    text-align: center;
    margin-block: .5em;
  }
  .group :global([data-name="total"]) {
    width: 100%;
    text-transform: uppercase;
    margin-block: .5em;
    opacity: .7;
  }
  button {
    font-size: .8em;
  }
  .cost {
    text-align: center;
    display: inline-block;
    width: 100%;
    font-size: .8em;
  }
  .cost.max {
    font-size: .74em;
  }

</style>
