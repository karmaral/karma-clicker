<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import { Card, Value } from '$ui';
  import {
    PlanetManager, BuildingManager, NotificationManager, ResourceManager,
  } from '$lib/managers';
  import Notification from '$features/notification/Notification.svelte';
  import { progression, validate } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { wire } from '$lib/wiring.svelte';
  import { f } from '$lib/utils';
  import * as loop from '$lib/loop';
  import { Frame, Screen } from '$features/frame';
  import { DetailsScreen } from '$features/details';
  import { OverviewScreen } from '$features/overview';
  import { RefineryScreen } from '$features/refinery';
  import DevPanel from '$features/dev/DevPanel.svelte';

  PlanetManager.unlock('first');
  PlanetManager.select('first');
  BuildingManager.unlock('main');

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
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <Card>
    {#if progression.isRevealed('frame.header')}
      <Frame />
    {:else}
      <div class="prelude">
        {#if progression.isRevealed('reading.experience')}
          <Value kind="xp" value={experience} />
        {/if}
        {#if progression.isRevealed('reading.posKarma')}
          <Value kind="pos" value={posKarma} />
        {/if}
      </div>
    {/if}

    <!-- All three at once, and only one of them looked at. A screen left is
         hidden rather than destroyed, so its planet keeps the context it was
         drawn in and comes back turning instead of blank. -->
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
  </Card>
</main>

{#if import.meta.env.DEV}
  <DevPanel />
{/if}

<SvelteToast />

<style>
  main {
    display: flex;
    justify-content: center;
    padding: var(--sp-5);
    min-height: 100%;
  }

  main > :global(.card) {
    width: 100%;
    max-width: 1440px;
  }

  /* The ground the hidden screens are positioned out of flow against. */
  .screens {
    position: relative;
  }

  .prelude {
    display: flex;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) 0;
  }
</style>
