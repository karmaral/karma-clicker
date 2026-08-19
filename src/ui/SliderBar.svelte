<script lang="ts">
  /**
   * A continuous 0–1 bar with a drag handle. Bare on purpose: whatever the two
   * ends mean is the caller's to label, so nothing here names a side.
   */
  interface Props {
    value: number;
    height?: string;
    label?: string;
    onchange?: (value: number) => void;
  }

  let { value, height = '18px', label = 'Split', onchange }: Props = $props();

  /** Below this a press is a click on a position, not a drag. */
  const DRAG_THRESHOLD = 4;

  const STEP = 0.05;

  let dragging = $state(false);
  let slid = false;
  let captured = false;
  let startX = 0;
  let track: DOMRect | null = null;

  const pct = $derived(`${Math.max(0, Math.min(1, value)) * 100}%`);

  function fractionAt(clientX: number) {
    if (!track?.width) return value;

    return Math.max(0, Math.min(1, (clientX - track.left) / track.width));
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
    const step = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
    if (!step) return;

    e.preventDefault();
    set(Math.max(0, Math.min(1, value + step)));
  }
</script>

<div
  class={['slider', { dragging }]}
  style:height
  role="slider"
  tabindex="0"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(value * 100)}
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
  {onclick}
  {onkeydown}
>
  <span class="fill" style:width={pct}></span>
  <span class="handle" style:left={pct}></span>
</div>

<style>
  .slider {
    position: relative;
    width: 100%;
    min-width: 0;
    background: var(--line-100);
    cursor: pointer;
    user-select: none;
    touch-action: pan-y;
  }

  .slider.dragging {
    cursor: grabbing;
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

  /* Sits astride the fill's edge, so the grab point is the boundary itself. */
  .handle {
    position: absolute;
    inset-block: -2px;
    width: 8px;
    translate: -50%;
    background: var(--ink-500);
    cursor: grab;
  }

  .slider.dragging .handle {
    cursor: grabbing;
  }
</style>
