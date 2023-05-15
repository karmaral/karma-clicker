<script lang="ts">
  import { formatNumber as f } from '$lib/utils';

  export let amount = 0;
  export let longForm = false;
  export let name = '';
  export let fontSize = '1em';
  export let layout: 'vertical' | 'horizontal' = 'vertical';

</script>

<span 
  data-name={name} 
  class="resource-quantity {layout}"
  style:font-size={fontSize} 
>
  {f(amount, 3, longForm)} <slot></slot>
  {#if layout === 'horizontal'}
    {name}
  {/if}
</span>

<style>
  .resource-quantity {
    position: relative;
    margin-inline: .5em;
    display: inline-block;
    text-align: center;
  }
  .resource-quantity:global(.vertical)::after {
    content: attr(data-name);
    display: block;
    text-transform: uppercase;
    font-size: .4em;
  }

</style>
