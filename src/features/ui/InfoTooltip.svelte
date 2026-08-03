<script lang="ts">
  export let contentElem: HTMLDivElement
</script>

<div class="tooltip"
  bind:this={contentElem}
>
  <slot>
    <h3>Tooltip title</h3>
    <p>Description</p>
  </slot>
</div>

<style>
  .tooltip {
    padding: .5em;
    background: hsl(0 0% 98%);
    border: 1px solid hsl(0 0% 0% / 10%);
  }

</style>
