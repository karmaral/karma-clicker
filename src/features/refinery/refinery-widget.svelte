<script lang="ts">
  import { refineryView } from '$lib/stores';
  import ResourceGroup from './resource-group.svelte';
  import ResourceGroupRefinable from './resource-group-refinable.svelte';
  import { BuyModeSwitcher } from '$features/ui';
  
  let buyMode: number | 'max' = 1;

</script>

{#if $refineryView}
  <button class="modal" on:click={() => $refineryView = false}></button>
  <div class="refinery-widget">
    <div class="container">
      <div class="header">
        <h3>Cosmic Refinery</h3>
      </div>
      <div class="content">
        <ResourceGroup type="karma" />
        <ResourceGroupRefinable type="red" {buyMode} />
        <ResourceGroupRefinable type="yellow" {buyMode} />
        <ResourceGroupRefinable type="blue" {buyMode} />
        <div class="buy-mode-wrapper">
          <BuyModeSwitcher 
            modes={[1, 10, 100, 'max']}
            bind:buyMode
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    background: unset;
    border: unset;
    padding: unset;
  }
  .refinery-widget {
    position: fixed;
    width: 60rem;
    background: white;
    border: 1px solid gainsboro;
    box-shadow: 0 0 20em hsl(0 0% 0% / 25%);
  }
  .container {
    padding: 1.2em;
    display: flex;
    flex-direction: column;
  }
  .content {
    display: flex;
    flex-wrap: wrap;
  }
  .content :global(.group.karma) {
    flex-basis: 100%;
    text-align: center;
  }
  .buy-mode-wrapper {
    text-align: center;
    border-top: 1px solid gainsboro;
    display: flex;
    justify-content: center;
    flex-basis: 100%;
  }
  .buy-mode-wrapper :global(.buy-mode-switcher) {
    font-size: .9em;
    margin-top: .8em;
    justify-content: space-evenly;
    flex-basis: 35%;
  }

</style>
