<script lang="ts">
  import { onMount } from 'svelte';
  import { ResourceManager, EffectManager } from '$lib/managers';
  import type { UpgradeData } from '$lib/types';
  import upgradeData from '$data/upgrades';

  const origin = 'main_action';
  const data: UpgradeData[] = upgradeData[origin];

  // $: valueYield = mainUpgrades.reduce((prev, current) => {
  //   const item = data.find(itm => itm.id === current);
  //   if (item) {
  //     return eval(item.effect.replace('valueYield', prev));
  //   }
  // }, 1);

  // let unitYield = 1;
  $: unitYield = $EffectManager.effects[origin]['unitYield']

  function addExperience() {
    ResourceManager.add('experience', 1, origin);
  }

  onMount(() => {
    const listener = (detail) => {
      ResourceManager.add('karma', detail.added / 3);
      // could have a passThrough = true arg that skips the multiplier effects
    };
    const effectListener = (detail) => {
      // const { target } = detail;
      // unitYield = EffectManager.get(target, 'unitYield');

    };
    EffectManager.addListener('add', effectListener);
    ResourceManager.addListener('experience', 'add', listener);
  });
</script>


<div class="main-action">
  <div class="container">
    <button class="planet" on:click={addExperience}>
      Incarnate
      <span>{unitYield} xp</span>
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  button {
    border: unset;
    border-radius: 50%;
    padding: 3em;
    aspect-ratio: 1;
    cursor: pointer;
    font-weight: bold;
    transition: all 0s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: hsl(0 0% 12%);
    color: white;
  }
  button:active {
    background: hsl(0 0% 20%);
    box-shadow:
      inset 0 1em 1em -.3em hsl(0 0% 0% / 10%),
      0 0 0 5px hsl(0 0% 50%);
    transition: box-shadow .13s ease-out, border ease-out .15s;
  }

</style>
