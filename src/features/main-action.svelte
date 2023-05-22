<script lang="ts">
  import { BuildingManager } from '$lib/managers';
  import { formatNumber as f, splitResourceString } from '$lib/utils';

  const id = 'main_action';
  let building = BuildingManager.getBuilding(id);

  function addExperience() {
    building.queueAction();
  }
</script>


<div class="main-action-widget">
  <div class="container">
    <button class="planet" on:click={addExperience}>
      <div class="content">
        <p class="title">Incarnate</p>
        {#each Object.entries($building.production) as [type, amount] (type)}
          <p><strong>{f(amount)}</strong> <span>{splitResourceString(type)[0]}</span></p>
        {/each}
      </div>
    </button>
  </div>
</div>

<style>
  .main-action-widget {
    flex-grow: 1;
  }
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .planet {
    border: unset;
    border-radius: 50%;
    padding: 3em;
    width: 12em;
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
    position: relative;
  }
  button:active {
    background: hsl(0 0% 20%);
    box-shadow:
      inset 0 1em 1em 0 hsl(0 0% 0% / 10%),
      0 0 0 5px hsl(0 0% 50%);
    transition: box-shadow .13s ease-out;
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  p.title {
    margin-block: 0 .4em;
  }
  p:not(.title) {
    margin-block: .2em;
    font-size: .8em;
    font-weight: 500;
    opacity: .8;
  }
  p span { opacity: .7; }

</style>
