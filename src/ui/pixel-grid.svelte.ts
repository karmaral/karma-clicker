/**
 * The device pixel grid a track is standing on, for the marks drawn along it.
 *
 * A hairline that does not land on a whole **device** pixel is split across two
 * and painted as a soft double line. Where the mark moves with a reading, the
 * same line turns crisp and soft as it travels, which reads as it changing
 * weight rather than changing place.
 *
 * CSS pixels are not that grid: at 125% or 150% display scaling one of them is
 * 1.25 or 1.5 device pixels, so a whole-CSS-pixel offset is only sometimes a
 * whole device one. Three things are needed and none are constants — the box's
 * width to place marks in, its **left edge** because a track's own origin can
 * sit on a fraction that a relative snap would inherit and go on smearing, and
 * the ratio, which changes under browser zoom and when a window moves screens.
 */

export function createPixelGrid() {
  let width = $state(0);
  let left = $state(0);
  let ratio = $state(1);
  let generation = $state(0);

  return {
    /**
     * `{@attach grid.measure}` on the box whose grid this is. An attachment
     * rather than a bound node, so there is nothing to wire up in an effect of
     * the caller's own.
     */
    measure(node: HTMLElement) {
      const read = () => {
        const box = node.getBoundingClientRect();
        const next = window.devicePixelRatio || 1;
        if (box.width === width && box.left === left && next === ratio) return;

        width = box.width;
        left = box.left;
        ratio = next;
        generation += 1;
      };

      read();

      // Size for a relayout, resize for a zoom — the ratio changes without the
      // box ever moving, and the box moves without the window resizing.
      const observer = new ResizeObserver(read);
      observer.observe(node);
      window.addEventListener('resize', read);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', read);
      };
    },

    /** Nought until measured: marks drawn against it would all stack on the left. */
    get width() { return width; },

    /**
     * Bumped every time the box actually moves or resizes. A mark that animates
     * its position should be keyed on this: a re-measure moves every mark at
     * once and none of them travelled — the reading did not change, the ground
     * under it did. Keyed, the marks are redrawn where they belong instead of
     * sliding in from wherever the box was last measured.
     */
    get generation() { return generation; },

    /**
     * A hairline's width — one device pixel, rounded up to what the scaling
     * makes of it, so the line is a whole number of them rather than 1.5. Hand
     * it to the marks as `--hair`, and to anything centring on one of them:
     * a mark is drawn *from* its position, so its middle is half of this along.
     */
    get hair() { return Math.max(1, Math.round(ratio)) / ratio; },

    /**
     * An offset into the box, snapped. On its *absolute* position and handed
     * back as an offset: what has to land on the grid is where the mark ends up
     * on screen, not how far it sits from an edge that may be off the grid
     * itself.
     */
    snap(offset: number) {
      return Math.round((left + offset) * ratio) / ratio - left;
    },
  };
}
