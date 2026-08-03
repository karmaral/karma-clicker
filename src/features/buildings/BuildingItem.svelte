<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRounded, formatNumber } from '$lib/utils';
  import type { ItemTextData } from '$types';
  import { BuildingManager, ResourceManager } from '$lib/managers';
  import type Building from '$lib/buildings/base';
  import { BuyModeSwitcher } from '$features/ui';

  export let building: Building;
  export let id: string;
  export let textData: ItemTextData;
  
  $: ({ 
    level,
    owned,
    duration,
    levelProgress,
    autonomous,
    inProgress,
    production } = $building);

  $: durationLabel = `${formatRounded(duration / 1000)}s`;
  $: continuous = duration < 50;


  let buyMode: 1 | 10 | 'max' | 'next' = 1;
  function calcBuyMode(building: Building, mode: typeof buyMode): number {
    switch (mode) {
      case 'max':
        return BuildingManager.getAffordableQuantity(id) || 1;
      case 'next':
        return building.nextUntilThreshold; 
      default:
        return mode;
    }
  }
  $: buyModeCount = calcBuyMode($building, buyMode);
  $: activeCost = $building.getCost(buyModeCount);

  let resource = ResourceManager.getResource(building.data?.cost_type);

  function calcCanAfford(amount: number, count: number) {
    return BuildingManager.canAfford(id, buyModeCount);
  }
  $: canAfford = calcCanAfford($resource.amount, buyModeCount);


  function purchase() {
    BuildingManager.purchase(id, buyModeCount);
  }
  function queueAction() {
    building.queueAction();
  }

  let progressElem: HTMLDivElement;

  async function animateProgress(duration: number) {
    if (!progressElem) return;

    progressElem.getAnimations().forEach(a => a.cancel());
    const animation = progressElem.animate(
      [{ width: '100%' }],
      { duration, fill: 'none', easing: 'linear' }
    );
    // const animation2 = actionRing.querySelector('.progress-ring__circle').animate(
    //   [{ strokeDashoffset: '0' }],
    //   { duration, fill: 'none' }
    // );
    //
    try {
      await animation.finished;
    } catch (err) {}
  }

  onMount(() => {
    const queueListener = (detail: { duration: number }) => {
      if (!continuous) {
        animateProgress(detail.duration);
      }
    };
    building.addListener('queue', queueListener);
  });
</script>

<div class="item">
  <div class="item-info">
    <div class="title">{owned} {textData.title}</div>
    <div class="description">{textData.description}</div>
  </div>
  <div class="time-counter" 
    class:continuous 
    style:--duration={`${duration * 10000}ms`}
  >
    <div bind:this={progressElem} 
      class="time-progress" 
    ></div>
    <span class="time-label">{durationLabel}</span>
  </div> 
  <div class="yield">
    Yield:     
    {#each Object.keys(production) as k}
      {@const unitYield = production[k]}
      {@const mult = $building.data.polarity_multiplier}
      {@const multYield = unitYield * mult}
      <span>
        <strong>{formatNumber(multYield)} {k}</strong>  per unit,
        <strong>{formatNumber(multYield * owned)}</strong> total
          {#if (k !== 'experience')}
            {@const bias = $building.data.polarity_bias}
            {@const orientation = bias === 0 
              ? ' (random)' 
              : Math.abs(bias) > 1 ? ' (zealot)' : ''}
            <br>
            Polarity bias: {bias}{orientation}, x{mult} multiplier
          {/if}
      </span>
    {/each}
  </div>
  <div class="level">
    {level}
    <div class="level-wrap">
      <span class="owned-label">{owned}</span>
      <div class="level-counter" style:--progress={levelProgress}>
        <div class="level-progress"></div>
      </div>
    </div>
  </div>
  
  <div class="buy-wrap">
    <BuyModeSwitcher 
      modes={[1, 10, 'next', 'max']} 
      bind:buyMode
    > 
      <button 
        on:click={purchase} 
        disabled={!canAfford}
        class="btn-purchase"
      >
        Purchase {buyModeCount}:&nbsp;
        <span><strong>{formatNumber(activeCost)} {building.data?.cost_type}</strong></span>
      </button>
    </BuyModeSwitcher>
  </div>
  <div class="actions">
    <button class="btn-action" 
      on:click={queueAction} 
      disabled={autonomous || inProgress || !owned}
    >
      {inProgress ? 'Incarnating' : 'Incarnate'}
    </button>
    <div class="autonomy">
      {#if autonomous}
        Autonomous <input type="checkbox" checked={autonomous}>
      {:else}
        Manual
      {/if}
    </div>
  </div>
</div>

<style>
  .item {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    border: 1px solid hsl(0 0% 0% / 15%);
    padding: 2em;
    font-size: .8em;
    margin-bottom: .5em;
  }
  .title {
    font-size: 1.3em;
    font-weight: bolder;
  }
  .description {
    color: hsl(0 0% 0% / .8);
  }
  .time-counter {
    position: relative;
    border: 1px solid hsl(0 0% 0% / .1);
  }
  .time-counter.continuous {
    animation: continuousProgress linear infinite;
    animation-duration: var(--duration, 10000ms);
    --color: hsl(0 0% 0% / .1);
    --color2: hsl(0 0% 0% / .15);
    background: repeating-linear-gradient(to right, var(--color) 0%, var(--color2) 30%, var(--color2) 70%, var(--color) 100%);
    background-size: 25%;
  }
  @keyframes continuousProgress {
    0%   { background-position:  100%; }
    100% { background-position: -100%; }
  }
  .time-progress {
    height: 1.4em;
    background: hsl(0 0% 0% / 30%);
    width: 0%;
  }
  .time-label {
    text-align: center;
    position: absolute;
    inset: 0;
  }
  .yield > span:not(:last-child)::after {
    content: " | ";
  }
  .level {
    display: flex;
    align-items: center;
    gap: 1em;
    padding-top: 1rem;
  }
  .level-wrap {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: .3em;
    position: relative;
  }
  .level-counter {
    height: .8em;
    background: hsl(0 0% 0% / 15%);
  }
  .level-progress {
    background: hsl(0 0% 0% / 60%);
    width: calc(var(--progress) * 1%);
    height: 100%;
  }
  .owned-label {
    position: absolute;
    inset: 0;
    transform: translateY(-100%);
    top: -.2rem;
    font-size: .8em;
    font-weight: bold;
    line-height: 1;
    text-align: center;
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-purchase {
    flex-grow: 1;
    font-size: .9em;
  }
  .actions {
    display: inline-flex;
    gap: 0.5em;
  }
  .actions > button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-action {
    font-weight: bolder;
    flex-grow: 1;
  }
  .autonomy {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: .3em 1em;
    gap: .3em;
  }
  input[type="checkbox"] {
    pointer-events: none;
    accent-color: black;
  }

</style>
