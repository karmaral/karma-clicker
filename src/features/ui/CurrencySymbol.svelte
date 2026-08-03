<script lang="ts">
  export let letter = 'k';
  export let striked = false;
  export let simple = false;
  export let offset = ['0', '0'];
  export let fontSize = '.5em';
  export let bgColor = 'black';

</script>

<div class="currency-symbol" 
  class:striked
  style:--offset-x={offset[0]}
  style:--offset-y={offset[1]}
  style:--font-size={fontSize}
  style:--bg-color={bgColor}
>
  <span>{letter}</span>
</div>

<style>
  .currency-symbol {
    display: inline-flex;
    color: white;
    font-weight: bold;
    position: relative;
    padding: .3em;
    font-size: var(--font-size, .5em);
    font-weight: 500;
    transform: translateY(-.3em);
  }
  .currency-symbol::before {
    content: "";
    position: absolute;
    width: 1.2em;
    height: 1.2em;
    top: 50%;
    left: 50%;
    background: var(--bg-color, black);
    z-index: -1;
    transform: translate(-50%, -50%) scaleY(1.25) rotate(45deg);
    border-radius: .1em;
  }
  .currency-symbol.striked::after {
    content: "=";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-100%, -50%);
  }
  span {
    transform: translateX(var(--offset-x)) translateY(var(--offset-y));
  }

</style>
