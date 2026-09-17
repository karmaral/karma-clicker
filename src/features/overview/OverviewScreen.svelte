<script lang="ts">
  /**
   * One axis, three bands. Selecting feeds the planet column beside it, and
   * that column carries the verb for whatever is picked.
   */
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { getAgesLabel, getPhaseLabel } from '$lib/labels';
  import { Label, Section } from '$ui';
  import ActiveCell from './ActiveCell.svelte';
  import PlanetDetail from './PlanetDetail.svelte';
  import BehindLedger from './BehindLedger.svelte';
  import AheadGrid from './AheadGrid.svelte';
  import { selection } from './selection.svelte';
  import { nav } from '$lib/nav.svelte';

  const BEHIND_PX = 24;
  /** Active and Ahead sit in one row now, so they share a picture size. */
  const HERE_PX = 40;

  const selected = $derived(selection.id);

  /** Whether the Behind band reports rates at all, or is still just a list. */
  const isReporting = $derived(progression.isRevealed('overview.harvest'));

  function getHereStat(id: string) {
    const planet = PlanetManager.getPlanet(id);

    return `${getAgesLabel(planet.agesLived)} · ${getPhaseLabel(planet.phase, planet.phasesPerAge)}`;
  }
</script>

<div class="overview view-layout">

  <div class="detail">
    {#if progression.isRevealed('overview.active')}
      <PlanetDetail id={selected} />
    {/if}
  </div>

  <div class="axis">

    <!-- `overview.ahead` reveals in the same beat as `overview.active` —
         one gate, one card. -->
    {#if progression.isRevealed('overview.active')}
      <Section subgrid label="Active">
        {#snippet aside()}
          <Label text="Ahead" />
        {/snippet}

        <div class="here">
          <div class="here-active">
            <ActiveCell
              id={PlanetManager.selected}
              {selected}
              stat={getHereStat}
              empty="No active planet."
              stillPx={HERE_PX}
              onpick={(id) => selection.pick(id)}
              ondblclick={() => nav.to('details')}
            />
          </div>

          <div class="here-ahead">
            <AheadGrid
              ids={PlanetManager.ahead}
              {selected}
              empty="Nowhere else is known."
              stillPx={HERE_PX}
              onpick={(id) => selection.pick(id)}
            />
          </div>
        </div>
      </Section>
    {/if}

    {#if progression.isRevealed('overview.behind') && PlanetManager.behind.length}
      <BehindLedger
        ids={PlanetManager.behind}
        {selected}
        reporting={isReporting}
        stillPx={BEHIND_PX}
        onpick={(id) => selection.pick(id)}
      />
    {/if}

  </div>
</div>

<style>
  /* Same two halves BehindLedger's rows use — planet+name, then time+yield —
     so Active+Ahead's split lines up with the ledger below via subgrid. */
  /* `start`, not the grid default: this column now stands full height, and left
     to stretch its bands would each take a share of the slack and drift apart.
     The bands stack from the top and the slack falls below them. */
  .axis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-content: start;
    column-gap: var(--sp-3);
    min-width: 0;
  }

  .here {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: start;
    min-width: 0;
  }

  .here-active {
    grid-column: 1;
    min-width: 0;
  }

  .here-ahead {
    grid-column: 2;
    min-width: 0;
  }

  .detail {
    display: flex;
    flex-direction: column;
    border-right: var(--rule-card);
    min-width: 0;
  }

  /* The end of the chain. `PlanetDetail`'s root is this section, so the slack
     has to be handed across the component seam before its verb can be pushed to
     the foot with `margin-top: auto`. */
  .detail > :global(.section) {
    flex: 1;
    min-height: 0;
  }
</style>
