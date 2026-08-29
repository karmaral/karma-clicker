<script lang="ts">
  import { Canvas } from '@threlte/core';
  import PlanetScene from './PlanetScene.svelte';
  import type { AnchorVisual } from './anchor';
  import type { HarnessVisual } from './harness';
  import type { SwarmVisual } from './orbit';
  import type { PulseVisual } from './pulse';
  import type { PlanetVisual } from './visual';
  import { useWatched } from './watched';
  import { f } from '$lib/utils';

  /** A beat past `sparkLife`'s default, so the number outlives the mark it named. */
  const POPUP_LIFE_MS = 900;

  /** Pre-formatted, so the two sources — the payout and the press — share a render. */
  interface Popup {
    id: number;
    x: number;
    y: number;
    text: string;
  }

  interface Props {
    visual: PlanetVisual;
    widthPx?: number;
    heightPx?: number;
    frame?: number;
    /** Where the camera stands, in world units. See `PlanetScene`. */
    offsetY?: number;
    backgroundToken?: string;
    swarm?: SwarmVisual;
    cohorts?: number[];
    /** The share of the swarm staying with the world. See `SoulSwarm`. */
    merge?: number;
    /** The harvest's alignment, and the whole switch for the core. See `PlanetScene`. */
    alignment?: number;
    anchors?: AnchorVisual;
    anchored?: boolean[];
    harness?: HarnessVisual;
    /** How many souls the harness carries. See `SoulSwarm`. */
    riders?: number;
    pulse?: PulseVisual;
    /**
     * The click's own duration, in ms — left `undefined` rather than defaulted
     * here, and forwarded as-is. See `PlanetScene`: whether this is absent (a
     * lab with no click) or merely 0 (an instant one) changes how the bolt
     * draws.
     */
    clickMs?: number;
    disabled?: boolean;
    /**
     * Who this world is, for keeping time. Two views of one world pass the same
     * key and share its spin, so changing screens — or scrolling a view out of
     * the observer's range and back — does not put it at nought.
     */
    clockKey?: string;
    clickActionVerb?: string;
    onclickaction?: () => void;
    /** A running count of landed yields. See `PlanetScene`. */
    yields?: number;
    /**
     * No economy is driving `yields` here, so every press counts as its own
     * landed yield — what a standalone preview wants and no real screen does,
     * since there a press only queues one. Ignores `yields` entirely rather
     * than adding to it, so a caller cannot half-wire the two.
     */
    demo?: boolean;
    /** What the next spark's popup should read. Read fresh, not captured at the click. */
    yieldValue?: number;
    /**
     * What a press itself is worth. Popped at the anchor it is going into, not
     * under the cursor: the press buys progress on a particular pole, and the
     * number belongs where it lands. Falls back to the pointer when there is no
     * anchor to name. Absent pops nothing.
     */
    pressValue?: number;
    pressFormat?: (value: number) => string;
  }

  let {
    visual,
    widthPx = 240,
    heightPx,
    frame = 2.7,
    offsetY = 0,
    backgroundToken = '--canvas',
    swarm,
    cohorts,
    merge,
    alignment,
    anchors,
    anchored,
    harness,
    riders,
    pulse,
    clickMs,
    clockKey,
    clickActionVerb = 'Incarnate',
    disabled = false,
    onclickaction,
    yields = 0,
    demo = false,
    yieldValue = 0,
    pressValue,
    pressFormat = (value: number) => `+${f(value)}`,
  }: Props = $props();

  let host: HTMLDivElement | undefined = $state();
  let isShown = $state(false);

  let popups: Popup[] = $state([]);
  let nextPopupId = 0;

  function pop(x: number, y: number, text: string) {
    const id = nextPopupId++;

    popups.push({ id, x, y, text });
    setTimeout(() => {
      popups = popups.filter((popup) => popup.id !== id);
    }, POPUP_LIFE_MS);
  }

  function onspark(point: { x: number; y: number }) {
    // A payout of nothing has nothing to say. The mark on the ground still
    // lands — the click happened — but the number would be a "+0".
    if (yieldValue <= 0) return;

    pop(point.x, point.y, `+${f(yieldValue)}`);
  }

  /**
   * Where the anchor being placed is, in px. A plain variable and not a rune:
   * the scene writes it every frame and only a press ever reads it, so putting
   * it through the reactive graph would re-render the view sixty times a second
   * for a number nothing draws.
   */
  let placingPoint: { x: number; y: number } | undefined;

  function onplacing(point: { x: number; y: number } | undefined) {
    placingPoint = point;
  }

  /**
   * The cursor's last known spot over the canvas, in the same px — a press, or
   * a move since. The bolt reads it fresh every frame it is alive, so its
   * strike-end follows the cursor rather than freezing where the yield landed.
   * Not a rune, for `placingPoint`'s reason: the scene reads it once a frame,
   * not once a render.
   */
  let lastPoint: { x: number; y: number } | undefined;

  function getPoint() {
    return lastPoint;
  }

  /** Tracks the cursor whenever it is over the canvas, press or no press. */
  function onmove(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();

    lastPoint = { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  /** At the anchor it pays into, or at the pointer when there is no anchor. */
  function onpress(e: MouseEvent) {
    flashes++;
    if (demo) demoYields++;
    onclickaction?.();

    // A keyboard press carries no coordinates, so it strikes from the middle.
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isPointed = e.clientX !== 0 || e.clientY !== 0;
    const x = isPointed ? e.clientX - box.left : box.width / 2;
    const y = isPointed ? e.clientY - box.top : box.height / 2;

    lastPoint = { x, y };

    if (pressValue === undefined) return;

    if (placingPoint) {
      pop(placingPoint.x, placingPoint.y, pressFormat(pressValue));
      return;
    }

    pop(x, y, pressFormat(pressValue));
  }

  /**
   * Whether the screen this sits on is the one being looked at. A hidden screen
   * keeps its canvas — that is the whole point of hiding it rather than leaving
   * it — so the scene is stopped instead of unmounted.
   */
  const isWatched = useWatched();
  const isLive = $derived(isShown && isWatched());

  /**
   * The count the scene answers. Kept here rather than in the scene because the
   * canvas is unmounted whenever the view scrolls away, and a click is the
   * view's event — the scene is only where it is drawn.
   */
  let flashes = $state(0);

  /** `demo`'s own landed-yield count — see the prop. */
  let demoYields = $state(0);
  const shownYields = $derived(demo ? demoYields : yields);

  /**
   * Each view is its own WebGL context and browsers cap those near sixteen —
   * past it the oldest are evicted and planets already drawn go blank. Mounting
   * only what is on screen is what makes a list of worlds affordable at all;
   * the div holds its px box either way, so nothing reflows on the swap.
   */
  $effect(() => {
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => { isShown = entry.isIntersecting; },
      { rootMargin: '300px' },
    );

    observer.observe(host);

    return () => observer.disconnect();
  });
</script>

<div
  class="planet-view"
  bind:this={host}
  style:width="{widthPx}px"
  style:height="{heightPx ?? widthPx}px"
>
  {#if isShown}
    <Canvas renderMode="on-demand">
      <PlanetScene
        {visual}
        {frame}
        {offsetY}
        isPaused={!isLive}
        {backgroundToken}
        {swarm}
        {cohorts}
        {merge}
        {alignment}
        {anchors}
        {anchored}
        {harness}
        {riders}
        {pulse}
        {clickMs}
        {clockKey}
        {flashes}
        yields={shownYields}
        {onspark}
        {onplacing}
        {getPoint}
      />
    </Canvas>
  {/if}

  <!-- A real button over the canvas rather than a handler on the div, and
       `onclick` rather than `onpointerdown`, so Enter and Space flash it too. -->
  {#if pulse}
    <button
      class="press"
      {disabled}
      onclick={onpress}
      onpointermove={onmove}
      aria-label={clickActionVerb}
    ></button>
  {/if}

  {#each popups as popup (popup.id)}
    <span class="yield-popup" style:left="{popup.x}px" style:top="{popup.y}px">
      {popup.text}
    </span>
  {/each}
</div>

<style>
  .planet-view {
    position: relative;
    flex: none;
    line-height: 0;
  }

  .press {
    position: absolute;
    inset: 0;
    padding: 0;
    border: none;
    background: none;
  }

  .yield-popup {
    position: absolute;
    translate: -50% -50%;
    font-weight: 600;
    font-size: var(--fs-sm);
    color: white;
    -webkit-text-stroke: 2px var(--ink-900);
    paint-order: stroke fill;
    pointer-events: none;
    animation: yield-rise 900ms ease-out forwards;
  }

  @keyframes yield-rise {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-24px);
      opacity: 0;
    }
  }
</style>
