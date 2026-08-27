<script lang="ts">
  /**
   * A continuous 0–1 bar with a drag handle. Bare on purpose: whatever the two
   * ends mean is the caller's to label, so nothing here names a side.
   */
  interface Props {
    value: number;
    /**
     * Ground the handle cannot be dragged onto, 0…1, drawn dead. Clamped here
     * rather than by the caller: a bar whose handle can be pulled somewhere it
     * then springs back from is a bar arguing with the hand on it.
     */
    floor?: number;
    /** The same ground at the far end, 0…1. 1 is the whole bar — no ceiling at all. */
    ceiling?: number;
    /**
     * The detent the handle snaps to, 0…1. 0 is continuous — the default, so a
     * caller that never asked for detents keeps the bar it had.
     */
    step?: number;
    height?: string;
    label?: string;
    onchange?: (value: number) => void;
  }

  let {
    value,
    floor = 0,
    ceiling = 1,
    step = 0,
    height = '18px',
    label = 'Split',
    onchange,
  }: Props = $props();

  /** Below this a press is a click on a position, not a drag. */
  const DRAG_THRESHOLD = 4;

  /** What an arrow key moves when nothing coarser is asked for. */
  const ARROW_STEP = 0.05;

  let dragging = $state(false);
  let slid = false;
  let captured = false;
  let startX = 0;
  let track: DOMRect | null = null;

  const held = $derived(Math.max(0, Math.min(1, floor)));
  const capped = $derived(Math.min(1, Math.max(held, ceiling)));

  const pct = $derived(`${clamp(value) * 100}%`);
  const floorPct = $derived(`${held * 100}%`);
  const ceilingPct = $derived(`${(1 - capped) * 100}%`);

  /**
   * Every reachable position, drawn. The dead ground is marked too — a tick the
   * handle stops short of is what says the other lever took it.
   */
  const ticks = $derived.by(() => {
    if (!step) return [];

    const marks: number[] = [];
    for (let at = step; at < 1 - 1e-6; at += step) marks.push(at);

    return marks;
  });

  function clamp(fraction: number) {
    return Math.max(held, Math.min(capped, fraction));
  }

  /** Snapped before it is clamped, so neither end is ever rounded away from. */
  function snap(fraction: number) {
    if (!step) return fraction;

    return Math.round(fraction / step) * step;
  }

  function fractionAt(clientX: number) {
    if (!track?.width) return value;

    return clamp(snap((clientX - track.left) / track.width));
  }

  function set(next: number) {
    if (next === value) return;

    onchange?.(next);
  }

  function onpointerdown(e: PointerEvent) {
    if (e.button !== 0) return;

    track = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    startX = e.clientX;
    slid = false;
    captured = false;
    dragging = true;
  }

  function onpointermove(e: PointerEvent) {
    if (!dragging) return;

    if (!slid) {
      if (Math.abs(e.clientX - startX) <= DRAG_THRESHOLD) return;

      slid = true;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      captured = true;
    }

    set(fractionAt(e.clientX));
  }

  function onpointerup(e: PointerEvent) {
    if (!dragging) return;

    dragging = false;
    if (captured) {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      captured = false;
    }
  }

  /** A press that never slid still moves the handle where it landed. */
  function onclick(e: MouseEvent) {
    if (slid) {
      e.preventDefault();
      e.stopPropagation();

      return;
    }

    track = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    set(fractionAt(e.clientX));
  }

  function onkeydown(e: KeyboardEvent) {
    const size = step || ARROW_STEP;
    const moved = e.key === 'ArrowLeft' ? -size : e.key === 'ArrowRight' ? size : 0;
    if (!moved) return;

    e.preventDefault();
    set(clamp(snap(value + moved)));
  }
</script>

<div
  class={['slider', { dragging }]}
  style:height
  data-cursor-grab
  data-cursor-dragging={dragging}
  role="slider"
  tabindex="0"
  aria-label={label}
  aria-valuemin={Math.round(held * 100)}
  aria-valuemax={Math.round(capped * 100)}
  aria-valuenow={Math.round(value * 100)}
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
  {onclick}
  {onkeydown}
>
  <span class="fill" style:width={pct}></span>
  <!-- Over the fill, not under it: the dead ground is filled too, and what
       separates it is that no drag can give it back. -->
  {#if held > 0}
    <span class="floor" style:width={floorPct}></span>
  {/if}
  {#if capped < 1}
    <span class="ceiling" style:width={ceilingPct}></span>
  {/if}
  <!-- Over both grounds, under the handle: a detent stays legible wherever it falls. -->
  {#each ticks as at (at)}
    <span class="tick" style:left={`${at * 100}%`}></span>
  {/each}
  <span class="handle" style:left={pct}></span>
</div>

<style>
  .slider {
    position: relative;
    width: 100%;
    min-width: 0;
    background: var(--line-100);
    user-select: none;
    touch-action: pan-y;
  }

  .slider:focus-visible {
    outline: var(--rule-section);
    outline-offset: 2px;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    display: block;
    background: var(--ink-900);
  }

  .floor {
    position: absolute;
    inset: 0 auto 0 0;
    display: block;
    background: var(--line-300);
  }

  .ceiling {
    position: absolute;
    inset: 0 0 0 auto;
    display: block;
    background: var(--line-300);
  }

  /* Matches Meter's, so the two bar families read as one. */
  .tick {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: var(--ink-200);
  }

  /* Sits astride the fill's edge, so the grab point is the boundary itself. */
  .handle {
    position: absolute;
    inset-block: -2px;
    width: 8px;
    translate: -50%;
    background: var(--ink-500);
  }
</style>
