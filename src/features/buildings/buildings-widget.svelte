<script lang="ts">
  import BuildingItem from './building-item.svelte';
  import entityData from '$data/entities';
  import textData from '$data/texts';

</script>

<div class="entities-widget">
  <div class="container">
    <BuildingItem data={entityData["basic"]} textData={textData["basic"]} />
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: .3em;
  }
</style>
