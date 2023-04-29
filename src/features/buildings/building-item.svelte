<script lang="ts">
  import { tick } from 'svelte';
  import { karma } from '$lib/resources';
  import { ResourceManager } from '$lib/managers';
  import { entities } from '$lib/stores';
  import { formatRounded, formatNumber } from '$lib/utils';
  import type { ItemData, ItemTextData } from '$types';

  export let data: ItemData;
  export let textData: ItemTextData;

  export let onAction = () => void 0;
  export let onLevelIncrease = () => void 0;
  
  $: currentLevel = $entities['basic'].level;
  $: quantity = $entities['basic'].quantity;
  $: valueYield = $entities['basic'].valueYield;
  $: duration = $entities['basic'].duration;

  $: durationLabel = `${formatRounded(duration / 1000)}s`;

  let buyMode: 1 | 10 = 1;
  // let actionRing: HTMLDivElement;

  function calcLevelProgress(currentQ: number) {
    const from = currentLevel > 0 
      ? data.upgrade_cost[currentLevel - 1]
      : 0;
    const next = data.upgrade_cost[currentLevel];
    const q = currentQ;
    if (!next) return 100;

    const progress = (q - from) / (next - from) * 100;
    console.log({progress, q, from, next });
    return progress % 100;
  }
  $: levelProgress = calcLevelProgress(quantity);

  let progressElem: HTMLDivElement;
  let inProgress = false;

  let isAutonomous = false;
  function toggleAuto(e: PointerEvent) {
    isAutonomous = !isAutonomous;
    if (isAutonomous) {
      queueAction();
    }
  }

  function cost(n: number) {
    const q = n + (quantity ?? 3) - 1;
    return data.cost * (1 + data.cost_multiplier) ** (q - 1);
  }
  let costSingle = data.cost;
  let costTen = cost(10);

  $: if (quantity) {
    costSingle = cost(1);
    costTen = cost(10);
  }

  $: activeCost = buyMode === 1 ? costSingle : costTen;


  function purchaseQuantity(n = 1) {
    let c = cost(n);
    if (c > $karma.amount) return;
    ResourceManager.remove('karma', c);
    increaseQuantity(n);
  }

  async function increaseQuantity(n = 1) {
    if (typeof quantity === 'undefined') return;

    entities.update(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        quantity: prev.basic.quantity + n, 
      },
    }));

    while (quantity >= data.upgrade_cost[currentLevel]) {
      increaseLevel();
      await tick();

      if (currentLevel >= data.upgrade_cost.length) {
        break;
      }
    }
  }

  function increaseLevel() {
    entities.update(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        level: prev.basic.level + 1,
        valueYield: prev.basic.valueYield + prev.basic.valueYield * data.yield_multiplier,
        duration: prev.basic.duration - prev.basic.duration * data.duration_reduction,
      }
    }));
    console.log({currentLevel, duration, valueYield });
    onLevelIncrease();
  }

  function addKarma() {
    const val = valueYield * quantity;
    const amt = Number(val.toFixed(val < 100 ? 2 : 1));
    ResourceManager.add('karma', amt);
  }

  function executeAction() {
    addKarma();
    onAction();
    inProgress = false;

    if (isAutonomous) {
      queueAction();
    }
  }

  function queueAction() {
    inProgress = true;
    animateProgress();
    setTimeout(executeAction, duration);
  }

  async function animateProgress() {
    if (!progressElem) return;

    const animation = progressElem.animate(
      [{ width: '100%' }],
      { duration, fill: 'none', easing: 'linear' }
    );
    // const animation2 = actionRing.querySelector('.progress-ring__circle').animate(
    //   [{ strokeDashoffset: '0' }],
    //   { duration, fill: 'none' }
    // );
    //
    await animation.finished;
  }

</script>

<div class="item">
  <div class="item-info">
    <div class="title">{quantity} {textData.title}</div>
    <div class="description">{textData.description}</div>
  </div>
  <div class="time-counter">
    <div bind:this={progressElem} class="time-progress"></div>
    <span class="time-label">{durationLabel}</span>
  </div> 
  <div class="level">
    {currentLevel}
    <div class="level-wrap">
      <span class="quantity-label">{quantity}</span>
      <div class="level-counter" style:--progress={levelProgress}>
        <div class="level-progress"></div>
      </div>
    </div>
  </div>
  
  <div class="buy-wrap">
    Buy
    <button class="btn-quantity" on:click={() => buyMode = 1} class:active={buyMode === 1}>1 </button>
    <button class="btn-quantity" on:click={() => buyMode = 10} class:active={buyMode === 10}>10 </button>
    <button 
      on:click={() => purchaseQuantity(buyMode)} 
      disabled={activeCost > $karma.amount}
    >
      <span style:font-size=".9em">{formatNumber(activeCost)} karma</span>
    </button>
  </div>
  <div class="actions">
    <button class="btn-action" 
      on:click={queueAction} 
      disabled={isAutonomous || inProgress || !quantity}
    >
      Incarnate
    </button>
    <button on:click={toggleAuto}
      disabled={!quantity}
    >
      Autonomous <input type="checkbox" checked={isAutonomous}>
    </button>
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
  }
  .title {
    font-size: 1.3em;
    font-weight: bolder;
  }
  .description {
    font-size: .8em;
    color: hsl(0 0% 0% / .8);
  }
  .time-counter {
    position: relative;
    border: 1px solid hsl(0 0% 0% / .1);
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
  .quantity-label {
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
  .buy-wrap {
    display: flex;
    gap: .3em;
    align-items: center;
  }
  .buy-wrap > .btn-quantity {
    border: unset;
    background: unset;
    opacity: .8;
 }
  .buy-wrap > .btn-quantity.active {
    font-weight: bold;
    opacity: 1;
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
  input[type="checkbox"] {
    accent-color: black;
  }

</style>
