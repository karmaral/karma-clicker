<script lang="ts">
  /**
   * Pinned to the bottom of the card: the screen tabs laid across the left, and
   * beside them the one verb that is about the run rather than about a world —
   * every planet verb went back to the planet column it acts on.
   *
   * A strip rather than a band. The tabs take a measured width and the rest of
   * the row is ground, so the bar reads as a control cluster at one end of the
   * card instead of a fourth register spanning it.
   *
   * The row empties during a takeover: that screen draws its own verb over the
   * whole card and there must be exactly one on screen, and the takeover
   * carries its own "Not yet" door out, so the tabs go with it. The log stays —
   * it is about the run and not about the screen, and a takeover is the moment
   * you most want to read back.
   */
  import { nav } from '$lib/nav.svelte';
  import { progression } from '$lib/progression';
  import { EndRunVerb } from '$features/prestige';
  import Log from '$features/Log.svelte';
  import Navbar from './Navbar.svelte';

  interface Props {
    railed: boolean;
  }

  let { railed }: Props = $props();
</script>

<div class="action-bar">
  <div class="strip" class:railed>
    <div class="content">
      {#if !nav.isTakeover}
        <Navbar />

        <div class="run">
          {#if nav.active === 'overview'}
            <EndRunVerb />
          {/if}
        </div>
      {/if}
    </div>

    {#if progression.isRevealed('shared.log')}
      <div class="log"><Log /></div>
    {/if}
  </div>
</div>

<style>
  /* A tab's own height, not a panel's: the bar stopped carrying buttons when
     the verbs went back to their columns, and the 105px they needed left the
     strip mostly air.

     `scrollbar-gutter` on an `overflow: hidden` box reserves the same width the
     body's scrollbar takes without ever scrolling, which is what keeps the two
     grids' tracks over one another. */
  .action-bar {
    border-top: var(--rule-strong);
    overflow: hidden;
    scrollbar-gutter: stable;
    height: 48px;
  }

  /* The body's own outer split, so `.content` below stands on exactly the box a
     screen stands on. The rail's track is here to be empty — it is what makes
     the first one the right width. */
  .strip {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
  }

  .strip.railed {
    grid-template-columns: var(--body-split);
  }

  /**
   * One tab, published for the navbar to take however many of it needs. Two of
   * them is the planet column, so the seam after the second tab lands on the
   * rule that column draws — the tabs measure the body rather than sitting near
   * it.
   *
   * The figure is `.view-layout`'s arithmetic and not a guess at it: this box
   * carries the same `--sp-4` inline padding a screen does, so `100%` is the
   * same content width, the planet column is what remains after the one column
   * gap times 4 of 10.25, and a tab is half of that. `100%` resolves against
   * this box wherever the property is finally read, so the navbar must stay a
   * child of it.
   */
  .content {
    display: flex;
    align-items: stretch;
    padding-inline: var(--sp-4);
    min-width: 0;
    --tab: calc((100% - var(--sp-4)) * 2 / 10.25);
  }

  /* Beside the tabs rather than at the far edge — pushed right it would end up
     under the upgrade rail, which is not what it is about. */
  .run {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    padding-inline: var(--sp-4);
    min-width: 0;
  }

  /* The far edge, which is the rail's when there is one: out of flow and pegged
     to the strip rather than pushed to the end of `.content`, since that box
     stops at the seam. The strip is the gutter-reduced width, so `--sp-4` here
     is the same inset a screen's own content sits at. */
  .log {
    position: absolute;
    right: var(--sp-4);
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
  }
</style>
