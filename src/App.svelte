<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import { Card, Value } from '$ui';
  import { PlanetManager, BuildingManager, ResourceManager } from '$lib/managers';
  import { progression, validate } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { wire } from '$lib/wiring.svelte';
  import { f } from '$lib/utils';
  import * as loop from '$lib/loop';
  import { Frame } from '$features/frame';
  import { DetailScreen } from '$features/detail';
  import { OverviewScreen } from '$features/overview';
  import { RefineryScreen } from '$features/refinery';
  import DevPanel from '$features/dev/DevPanel.svelte';

  PlanetManager.unlock('first');
  PlanetManager.select('first');
  BuildingManager.unlock('main');

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

    {#if nav.active === 'detail'}
      <DetailScreen />
    {:else if nav.active === 'overview'}
      <OverviewScreen />
    {:else}
      <RefineryScreen />
    {/if}
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

  .prelude {
    display: flex;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) 0;
  }
</style>
