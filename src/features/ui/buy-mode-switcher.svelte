<script lang="ts">
  import type { BuyMode } from '$types';

  export let modes: BuyMode[] = [1, 10, 'max'];
  export let buyMode: BuyMode;

</script>

<div class="buy-mode-switcher">
  {#each modes as m }
   <button
      class:active={m === buyMode}
      on:click={() => buyMode = m}
    >
      {m}
    </button> 
  {/each}
  <slot />
</div>

<style>
  .buy-mode-switcher {
    display: flex;
    gap: .3em;
    align-items: center;
    justify-content: space-between;
  }
  .buy-mode-switcher > button {
    border: unset;
    background: unset;
    opacity: .8;
    text-transform: uppercase;
  }
  .buy-mode-switcher > button.active {
    font-weight: bold;
    opacity: 1;
  }

</style>
