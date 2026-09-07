<script lang="ts">
  /**
   * One axis, three bands. Selecting feeds the planet column beside it, and
   * that column carries the verb for whatever is picked.
   *
   * And the takeover's screen: the first harvest takes this screen's body
   * rather than the frame, so the navbar stays lit while the one decision the
   * Overview leads to is being taken. Hidden by the same `Screen` the tabs use
   * rather than removed — a band is a planet apiece, and those WebGL contexts
   * should come back turning instead of blank.
   */
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import { Label, Section } from '$ui';
  import ActiveCell from './ActiveCell.svelte';
  import PlanetDetail from './PlanetDetail.svelte';
  import BehindLedger from './BehindLedger.svelte';
  import AheadGrid from './AheadGrid.svelte';
  import HarvestLedger from './HarvestLedger.svelte';
  import { selection } from './selection.svelte';
  import { FirstHarvestScreen } from '$features/harvest';
  import { PrestigeScreen } from '$features/prestige';
  import { Screen } from '$features/frame';
  import { nav } from '$lib/nav.svelte';

  const BEHIND_PX = 24;
  /** Active and Ahead sit in one row now, so they share a picture size. */
  const HERE_PX = 40;

  const selected = $derived(selection.id);

  /** Whether the Behind band reports rates at all, or is still just a list. */
  const isReporting = $derived(progression.isRevealed('overview.harvest'));

  function getHereStat(id: string) {
    const planet = PlanetManager.getPlanet(id);

    return `${f(planet.agesLived)} ages · phase ${planet.phase + 1} of ${planet.phasesPerAge}`;
  }
</script>

<div class="stack">
  <Screen active={!nav.isHarvesting && !nav.isPrestiging}>
    <div class="overview view-layout">

      <div class="detail">
        {#if progression.isRevealed('overview.active')}
          <PlanetDetail id={selected} />
        {/if}

        <!-- Only while the Behind band cannot carry the rates itself. -->
        {#if isReporting && !PlanetManager.behind.length}
          <HarvestLedger />
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
  </Screen>

  {#if nav.isHarvesting}
    <FirstHarvestScreen onclose={() => nav.closeHarvest()} />
  {/if}

  <!-- Plain `{#if}` where the harvest takes a `Screen`: there is no WebGL here
       to keep alive off-camera. -->
  {#if nav.isPrestiging}
    <PrestigeScreen onclose={() => nav.closePrestige()} />
  {/if}
</div>

<style>
  /* The ground the hidden body is positioned out of flow against, while the
     harvest holds the screen. */
  .stack {
    position: relative;
  }

  /* Same two halves BehindLedger's rows use — planet+name, then time+yield —
     so Active+Ahead's split lines up with the ledger below via subgrid. */
  .axis {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
</style>
