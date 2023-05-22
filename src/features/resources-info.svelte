<script lang="ts">
  import { 
    experience,
    negKarma, 
    posKarma, 
    combinedKarma,
    combinedRed,
    combinedYellow,
    combinedBlue,
  } from '$lib/resources';
  import { refineryView } from '$lib/stores';
  import { formatNumber as fmt } from '$lib/utils';
  import { ProgressBar, CurrencySymbol, ResourceQuantity } from '$features/ui';

</script>

<div class="resources">

  <div class="resource experience">
    <p>
      <ResourceQuantity name="experience" amount={$experience.amount}> 
        <CurrencySymbol 
          letter="ξ"
          bgColor="var(--experience)"
         />
      </ResourceQuantity>
    </p>
    <p class="total">{fmt($experience.total)} total</p>
  </div>

  <div class="resource karma">
    <p>
      <ResourceQuantity name="negative" amount={$negKarma.amount}> 
        <CurrencySymbol letter="Ͷ" striked={true} />
      </ResourceQuantity>
      <ResourceQuantity name="positive" amount={$posKarma.amount}> 
        <CurrencySymbol letter="Ϗ" striked={true} />
      </ResourceQuantity>
    </p>
    <span class="title">Karma</span>
    <p class="total">{fmt($combinedKarma)} total</p>
  </div>

  <div class="actions-wrapper">
    <div class="resource tokens">
      <p>
        <ResourceQuantity name="red" amount={$combinedRed}> 
          <CurrencySymbol 
            letter="ϱ" 
            offset={['0px', '-.1em']}
            bgColor="var(--red)"
          />
        </ResourceQuantity>
        <ResourceQuantity name="yellow" amount={$combinedYellow}> 
          <CurrencySymbol 
            letter="ɣ" 
            offset={['0px', '-.08em']}
            bgColor="var(--yellow)"
          />
        </ResourceQuantity>
        <ResourceQuantity name="blue" amount={$combinedBlue}> 
          <CurrencySymbol 
            letter="ϐ" 
            bgColor="var(--blue)"
          />
        </ResourceQuantity>
      </p>
      <span class="title">Learning Tokens</span>
    </div>
      <button class="btn-refine" 
        on:click={() => $refineryView = !$refineryView}
      >
        Refine
      </button>
  </div>

</div>
<ProgressBar 
  negative={$negKarma.amount}
  positive={$posKarma.amount}
/>


<style>
  .resources {
    display: grid;
    gap: .5em;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
  }
  .resource {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: .3em;
    font-size: 1.5em;
  }
  .resource .title {
    font-size: .4em;
    text-transform: uppercase;
    line-height: 1.4;
  }
  .resource :global(svg) {
    width: 1.5em;
    height: 1.5em;
    transform: translateY(.1em);
    opacity: .3;
  }

  .actions-wrapper {
    display: grid;
    grid-template-columns: 5fr 1fr;
  }
  .btn-refine {
    text-transform: uppercase;
    font-size: .6em;
    font-weight: bolder;
    padding: 1em 2em;
    height: calc(100% - .3em);
    background-color: unset;
    border: 1px solid hsl(0 0% 0% / 15%);
  }

  .btn-refine:hover {
    background-color: hsl(0 0% 0% / 5%);
  }

  p {
    margin: 0;
  }
  .total {
    display: none;
    font-size: .5em;
  }

</style>
