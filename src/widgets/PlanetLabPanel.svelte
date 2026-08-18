<script lang="ts">
  import LabPanel from './LabPanel.svelte';
  import Puck from './Puck.svelte';
  import {
    keyLight, LEAN_REACH, TILT_REACH, VISUAL_GROUPS, VISUAL_PARAMS, type PlanetVisual,
  } from './planet';
  import { planetLab } from './planet-lab.svelte';

  let copied = $state(false);

  const current = $derived(planetLab.current);

  function hold(lean: number, tilt: number) {
    planetLab.set('lean', lean);
    planetLab.set('tilt', tilt);
  }

  function resetHold() {
    planetLab.reset('lean');
    planetLab.reset('tilt');
  }

  async function copy() {
    await navigator.clipboard.writeText(planetLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="planet lab · {planetLab.selected}"
  groups={VISUAL_GROUPS}
  params={VISUAL_PARAMS}
  value={(key) => current[key as keyof PlanetVisual]}
  set={(key, value) => planetLab.set(key as keyof PlanetVisual, value)}
  reset={(key) => planetLab.reset(key as keyof PlanetVisual)}
>
  {#snippet header()}
    <div class="row picks">
      {#each planetLab.ids as id (id)}
        <button
          class={['pick', { on: id === planetLab.selected }]}
          onclick={() => planetLab.select(id)}
        >{id}</button>
      {/each}
    </div>

    <div class="row">
      <span class="id">seed {current.seed}</span>
      <button onclick={() => planetLab.reseed()}>reseed</button>
      <button onclick={() => planetLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>
  {/snippet}

  {#snippet under(key: string)}
    <!--
      Under the weight it aims, but it is not the world's: one light serves every
      planet and the anchors on it, so this puck moves them all at once and a
      world with Key at 0 still feels it through its poles.
    -->
    {#if key === 'key'}
      <div class="row aim">
        <span class="id">Direction (shared)</span>
        <Puck
          label="Key direction"
          x={keyLight.x}
          y={keyLight.y}
          set={(x, y) => keyLight.point(x, y)}
          reset={() => keyLight.revert()}
        />
        <span class="num">
          {keyLight.x.toFixed(2)}<br />{keyLight.y.toFixed(2)}
        </span>
      </div>
    {/if}

    <!-- Across is the lean, down is the tilt — and the light stays where it is,
         because the key is aimed in view space and the world turns under it. -->
    {#if key === 'spin'}
      <div class="row aim">
        <span class="id">Lean · Tilt</span>
        <Puck
          label="How the world is held"
          shape="square"
          x={current.lean}
          y={current.tilt}
          xReach={LEAN_REACH}
          yReach={TILT_REACH}
          set={hold}
          reset={resetHold}
        />
        <span class="num">
          {current.lean.toFixed(2)}<br />{current.tilt.toFixed(2)}
        </span>
      </div>
    {/if}
  {/snippet}
</LabPanel>

<style>
  /* Layout for these rows comes from LabPanel; the pucks style themselves. */

  /**
   * The ids run past the panel rather than wrapping. Wrapping would push the
   * sliders down by a row every few worlds and the panel is already the full
   * height of its rail; a strip that scrolls costs the same height at any count.
   */
  .picks {
    /**
     * Not shorthand for tidiness: `.body` is a column flex box with a bounded
     * height, and a scroll container's automatic minimum size is 0 rather than
     * its content. Without this the row is free to shrink and collapses to its
     * own padding the moment `overflow-x` stops being `visible`.
     */
    flex: none;
    flex-wrap: nowrap;
    overflow-x: auto;
    /* Room for the bar, so it does not sit on top of the buttons. */
    padding-bottom: var(--sp-1);
    scrollbar-width: thin;
    overscroll-behavior-x: contain;
  }

  /* Without this a long list squeezes every id instead of overflowing. */
  .picks .pick {
    flex: none;
    white-space: nowrap;
  }

  .aim {
    align-items: flex-start;
    padding: var(--sp-1) 0;
  }

</style>
