<script lang="ts">
  /**
   * One screen's slot. Kept mounted once it has been asked for, and hidden the
   * rest of the time.
   *
   * A screen destroyed on the way out takes its WebGL context and every shader
   * compiled against it, so coming back is an empty box for as long as the
   * rebuild takes. Nothing is torn down here — the canvas is still there, still
   * drawn, and only stops being painted.
   */
  import { setWatched } from '$widgets/planet';
  import { untrack, type Snippet } from 'svelte';

  interface Props {
    active: boolean;
    children: Snippet;
  }

  let { active, children }: Props = $props();

  /**
   * Built on first ask, never taken down. A screen never reached costs nothing —
   * the Overview does not load three.js before it is opened.
   *
   * Seeded rather than started at `false`, so the screen the app opens on is
   * there in the first pass and not a frame behind it. Untracked because that is
   * a starting value and the effect below is what watches for the rest.
   */
  let isBuilt = $state(untrack(() => active));

  $effect(() => {
    if (active) isBuilt = true;
  });

  setWatched(() => active);
</script>

{#if isBuilt}
  <div class="screen" class:hidden={!active} inert={!active}>
    {@render children()}
  </div>
{/if}

<style>
  /* Passes the height it was given straight down. A block box here would size to
     its content and every screen below would inherit the hug — see `.screens`. */
  .screen {
    display: grid;
    min-width: 0;
  }

  /**
   * Out of flow rather than gone: a screen at `display: none` measures nought,
   * which would put the planet stage's width at nought, drop its view out of the
   * observer that mounts the canvas, and resize that canvas to nothing — every
   * one of them the teardown this exists to prevent. Height is left natural, so
   * the screen comes back at its own size instead of the one it was hidden at.
   */
  .hidden {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    visibility: hidden;
    pointer-events: none;
  }
</style>
