<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { Card, Label, Rail, Value } from '$ui';
  import {
    PlanetManager, BuildingManager, NotificationManager, ResourceManager,
  } from '$lib/managers';
  import Notification from '$features/notification/Notification.svelte';
  import planetTexts from '$data/planets-texts';
  import { progression, validate } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { log } from '$lib/log.svelte';
  import logTexts from '$data/log-texts';
  import { loadPending, takeLegacy } from '$lib/save';
  import { wire } from '$lib/wiring.svelte';
  import { f } from '$lib/utils';
  import * as loop from '$lib/loop';
  import { ActionBar, AllUpgrades, Frame, Screen, UpgradeRail } from '$features/frame';
  import { catalogue } from '$features/frame/upgrades.svelte';
  import { DetailsScreen } from '$features/details';
  import { OverviewScreen } from '$features/overview';
  import { RefineryScreen } from '$features/refinery';
  import DevPanel from '$features/dev/DevPanel.svelte';
  import Log from '$features/Log.svelte';

  // Read outside the `if` and unconditionally: a boot that consumed a pending
  // save would otherwise leave the legacy to ambush the boot after it.
  const legacy = takeLegacy();

  // The module graph is the reset, so a fresh run is what the graph plus these
  // three lines already are. A load happens instead of them, never over them —
  // a save is a whole run including its wisdom and its beat, so a legacy laid
  // over one would either double the wisdom or contradict the beat.
  if (!loadPending()) {
    PlanetManager.unlock('first');
    PlanetManager.select('first');
    BuildingManager.unlock('main');

    // Before `wire()`, and it matters: `watchBeats` seeds itself on its first
    // run, so jumping here is silent where jumping after it would dump every
    // beat behind you into the log on frame one.
    if (legacy) {
      ResourceManager.add('wisdom', legacy.wisdom);
      progression.jumpTo(legacy.beat);
      log.add(logTexts.prestige.legacy(legacy.wisdom));
    }
  }

  /** What a notification looks like. The manager only knows that one exists. */
  NotificationManager.use(({ title, description }) => {
    toast.push({
      component: {
        src: Notification,
        props: { title, description },
        sendIdTo: 'toastId',
      },
      pausable: true,
      intro: { x: 0, y: 128 },
    });
  });

  const experience = $derived(f(ResourceManager.getAmount('experience')));
  const posKarma = $derived(f(ResourceManager.getAmount('karma_positive')));

  const preludePlanet = $derived(PlanetManager.getActive());
  const preludePlanetName = $derived(planetTexts[preludePlanet?.id ?? '']?.title);

  const hasRail = $derived(progression.isRevealed('frame.rail') && !nav.isTakeover);

  wire();

  onMount(() => {
    if (import.meta.env.DEV) {
      validate().forEach((problem) => console.warn('[progression]', problem));
    }

    loop.start();
    return loop.stop;
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wdth,wght@75..125,300..700&display=swap" rel="stylesheet">
</svelte:head>

<main inert={catalogue.isOpen}>
  <Card>
    {#if progression.isRevealed('frame.header')}
      <Frame />
    {:else}
      <div class="prelude">
        {#if preludePlanetName}
          <div class="name"><Label text={preludePlanetName} tone="active" /></div>
        {/if}

        <div class="readings">
          {#if progression.isRevealed('reading.experience')}
            <div class="reading">
              <Label text="Experience" size="sm" />
              <Value kind="xp" value={experience} size="hero" />
            </div>
          {/if}
          {#if progression.isRevealed('reading.posKarma')}
            <div class="reading">
              <Label text="Karma" size="sm" />
              <Value kind="pos" value={posKarma} size="hero" />
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <div class="body" class:railed={hasRail}>
      <div class="screens">
        <Screen active={nav.active === 'details'}>
          <DetailsScreen />
        </Screen>

        <Screen active={nav.active === 'overview'}>
          <OverviewScreen />
        </Screen>

        <Screen active={nav.active === 'refinery'}>
          <RefineryScreen />
        </Screen>
      </div>

      {#if hasRail}
        <Rail>
          <UpgradeRail />
        </Rail>
      {/if}
    </div>

    {#if progression.isRevealed('frame.header')}
      <ActionBar railed={hasRail} />
    {/if}
  </Card>
</main>

{#if import.meta.env.DEV}
  <DevPanel />
{/if}

{#if progression.isRevealed('shared.log')}
  <Log />
{/if}

{#if catalogue.isOpen}
  <AllUpgrades />
{/if}

<SvelteToast />

<style>
  main {
    display: flex;
    justify-content: center;
    height: 100%;
  }

  main > :global(.card) {
    width: 100%;
    max-width: 1440px;
  }

  .body {
    display: grid;
    align-items: stretch;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* Stable so its scrollbar never shifts the grid's 9fr/2fr split out from
       under the action bar's matching grid below, which reserves the same gutter. */
    scrollbar-gutter: stable;
  }

  .body.railed {
    grid-template-columns: minmax(0, 9fr) minmax(0, 2fr);
  }

  /* The ground the hidden screens are positioned out of flow against. */
  .screens {
    position: relative;
    min-width: 0;
  }

  /* The rail reads the screens' height, never sets it — see Rail.svelte. */
  .body > :global(.rail) {
    min-width: 0;
  }

  .prelude {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4) 0;
  }

  .readings {
    display: flex;
    justify-content: center;
    gap: var(--sp-6);
  }

  .reading {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    --badge-size: 18px;
    --badge-gap: 12px;
  }
</style>
