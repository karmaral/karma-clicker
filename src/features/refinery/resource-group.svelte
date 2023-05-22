<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { ResourceManager } from '$lib/managers';
  import type { BaseResourceType, ResourceType } from '$types';
  import { ResourceQuantity } from '$features/ui';
  import type PolarizedResource from '$lib/resources/polarized';
  import texts from '$data/resources-texts';

  export let type: BaseResourceType;

  let typeNeg = `${type}_negative` as ResourceType;
  let typePos = `${type}_positive` as ResourceType;

  let label = texts[type].title;

  let negative = ResourceManager.getResource(typeNeg) as PolarizedResource;
  let positive = ResourceManager.getResource(typePos) as PolarizedResource;
  let combined = ResourceManager.getCombinedTotal(type, true) as Readable<number>;

  const fontSize = '1.5em';


</script>

<div class="group {type}">
  <h5>{label}</h5>
  <ResourceQuantity amount={$negative.amount} name="negative" {fontSize} />
  <ResourceQuantity amount={$positive.amount} name="positive" {fontSize} />
  <ResourceQuantity amount={$combined} name="total" {fontSize} />

</div>

<style>
  .group {
    padding: 1em;
    flex-grow: 1;
  }
  .wrapper {
    display: flex;
    flex-direction: column;
  }
  :global(.group.karma) > .wrapper {
    display: inline;
  }
  h5 {
    margin-block: .2em;
    text-align: center;
  }
</style>
