<script lang="ts">
  /**
   * Two numbers authored as one drag. Lifted out of the planet lab when the
   * hold wanted the same control the key already had.
   *
   * `disc` clamps to the unit circle and rounds the frame — the shape a
   * direction wants, where what is left over is the third component. A pair of
   * independent angles wants `square`, which clamps each on its own.
   */
  interface Props {
    label: string;
    /** In their own units; the puck divides by the reach and never sees them. */
    x: number;
    y: number;
    xReach?: number;
    yReach?: number;
    shape?: 'disc' | 'square';
    set: (x: number, y: number) => void;
    /** Double-click, the same undo a slider carries. */
    reset?: () => void;
  }

  let {
    label, x, y, xReach = 1, yReach = 1, shape = 'disc', set, reset,
  }: Props = $props();

  let pad: HTMLButtonElement | undefined = $state();
  let dragging = $state(false);

  const at = $derived({ x: x / xReach, y: y / yReach });

  /** Screen y runs down, every axis a puck holds runs up. */
  function moveTo(event: PointerEvent) {
    if (!pad) return;

    const box = pad.getBoundingClientRect();
    let nx = ((event.clientX - box.left) / box.width) * 2 - 1;
    let ny = -(((event.clientY - box.top) / box.height) * 2 - 1);

    if (shape === 'disc') {
      const reach = Math.hypot(nx, ny);
      const scale = reach > 1 ? 1 / reach : 1;

      nx *= scale;
      ny *= scale;
    } else {
      nx = Math.max(-1, Math.min(1, nx));
      ny = Math.max(-1, Math.min(1, ny));
    }

    set(nx * xReach, ny * yReach);
  }

  function grab(event: PointerEvent) {
    dragging = true;
    pad?.setPointerCapture(event.pointerId);
    moveTo(event);
  }
</script>

<button
  class={['puck', shape]}
  type="button"
  aria-label={label}
  bind:this={pad}
  onpointerdown={grab}
  onpointermove={(e) => dragging && moveTo(e)}
  onpointerup={() => (dragging = false)}
  onlostpointercapture={() => (dragging = false)}
  onpointercancel={() => (dragging = false)}
  ondblclick={reset}
>
  <span class="knob" style:left="{50 + at.x * 50}%" style:top="{50 - at.y * 50}%"></span>
</button>

<style>
  .puck {
    position: relative;
    flex: none;
    width: 4.5rem;
    height: 4.5rem;
    padding: 0;
    border: var(--rule-card);
    background: var(--surface-alt);
    cursor: crosshair;
    touch-action: none;
  }

  .puck.disc {
    border-radius: 50%;
  }

  /** A horizon, so the disc reads as a hemisphere rather than a dial. */
  .puck.disc::after {
    content: '';
    position: absolute;
    inset: 25%;
    border: 1px dashed var(--line-300);
    border-radius: 50%;
  }

  /** Square, not a ring: the two axes are unrelated, and a circle drawn on them
      would claim they were one direction. */
  .puck.square::after {
    content: '';
    position: absolute;
    inset: 25%;
    border: 1px dashed var(--line-300);
  }

  .knob {
    position: absolute;
    width: 9px;
    height: 9px;
    margin: -4.5px 0 0 -4.5px;
    border-radius: 50%;
    background: var(--ink-900);
  }
</style>
