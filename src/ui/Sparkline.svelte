<script lang="ts">
  /**
   * A glyph, not a chart: no axes, no legend, no crosshair — see `SimChart` in
   * `features/sim` for the instrument version. Just a trend and, optionally, the
   * line it should be converging onto.
   */
  interface Props {
    values: number[];
    /** The equilibrium to read the curve against — a dashed rule, always in frame. */
    baseline?: number;
    width?: string;
    height?: string;
  }

  let { values, baseline, width = '84px', height = '26px' }: Props = $props();

  const WIDTH = 100;
  const HEIGHT = 100;

  /** Headroom above the tallest reading, so a curve pinned to its own peak still reads. */
  const top = $derived(Math.max(...values, baseline ?? 0, 0.001) * 1.08);

  function toY(value: number) {
    return HEIGHT - (Math.min(value, top) / top) * HEIGHT;
  }

  const path = $derived(
    values
      .map((value, i) => `${(i / Math.max(1, values.length - 1)) * WIDTH},${toY(value).toFixed(1)}`)
      .join(' '),
  );

  const baselineY = $derived(baseline !== undefined ? toY(baseline) : undefined);
</script>

<svg
  class="sparkline"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  preserveAspectRatio="none"
  style:width
  style:height
  role="img"
  aria-label="trend"
>
  {#if baselineY !== undefined}
    <line class="baseline" x1="0" x2={WIDTH} y1={baselineY} y2={baselineY} />
  {/if}
  {#if values.length > 1}
    <polyline class="curve" points={path} />
  {/if}
</svg>

<style>
  .sparkline {
    display: block;
    flex: none;
  }

  .curve {
    fill: none;
    stroke: var(--ink-900);
    stroke-width: 1.5;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .baseline {
    stroke: var(--ink-300);
    stroke-width: 1;
    stroke-dasharray: 2 2;
    vector-effect: non-scaling-stroke;
  }
</style>
