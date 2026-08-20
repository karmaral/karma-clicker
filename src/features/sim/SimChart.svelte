<script lang="ts">
  /**
   * One axis, however many lines. Hand-rolled rather than pulled in: the whole
   * of what a balance chart needs is a polyline and four labelled ticks.
   */
  import type { Series } from './types';
  import { clockTime, figure } from './format';

  interface Props {
    series: Series[];
    /** Log is the default read for an idle curve — linear hides the first hour. */
    logY?: boolean;
    title?: string;
    height?: number;
    /** X is run time unless said otherwise; the merge curve's axis is a share. */
    xFormat?: (value: number) => string;
    yFormat?: (value: number) => string;
    /** Vertical rules — the merge floor, a harvest, anything worth a line. */
    marks?: { at: number; label: string }[];
  }

  let {
    series,
    logY = false,
    title,
    height = 260,
    xFormat = clockTime,
    yFormat = figure,
    marks = [],
  }: Props = $props();

  const WIDTH = 720;
  const PAD = { left: 56, right: 14, top: 14, bottom: 30 };

  const points = $derived(series.flatMap((line) => line.points));

  /** The smallest positive value, so a log axis has a floor that is not −∞. */
  const floor = $derived.by(() => {
    const positives = points.map(([, y]) => y).filter((y) => y > 0);

    return positives.length ? Math.min(...positives) : 1;
  });

  function transform(value: number) {
    return logY ? Math.log10(Math.max(value, floor)) : value;
  }

  function invert(value: number) {
    return logY ? 10 ** value : value;
  }

  const bounds = $derived.by(() => {
    if (!points.length) return { x0: 0, x1: 1, y0: 0, y1: 1 };

    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => transform(y));
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);

    return {
      x0: Math.min(...xs),
      x1: Math.max(...xs) || 1,
      y0: logY ? y0 : Math.min(0, y0),
      // A flat line still needs a band to sit in.
      y1: y1 === y0 ? y0 + 1 : y1,
    };
  });

  const plot = $derived({
    width: WIDTH - PAD.left - PAD.right,
    height: height - PAD.top - PAD.bottom,
  });

  function toX(value: number) {
    const { x0, x1 } = bounds;

    return PAD.left + ((value - x0) / (x1 - x0 || 1)) * plot.width;
  }

  function toY(value: number) {
    const { y0, y1 } = bounds;

    return PAD.top + (1 - (transform(value) - y0) / (y1 - y0 || 1)) * plot.height;
  }

  function path(line: Series) {
    return line.points.map(([x, y]) => `${toX(x).toFixed(1)},${toY(y).toFixed(1)}`).join(' ');
  }

  const yTicks = $derived(
    Array.from({ length: 5 }, (_, i) => {
      const { y0, y1 } = bounds;
      const at = y0 + ((y1 - y0) * i) / 4;

      return { at, y: PAD.top + (1 - i / 4) * plot.height, label: yFormat(invert(at)) };
    }),
  );

  const xTicks = $derived(
    Array.from({ length: 5 }, (_, i) => {
      const { x0, x1 } = bounds;
      const at = x0 + ((x1 - x0) * i) / 4;

      return { x: PAD.left + (i / 4) * plot.width, label: xFormat(at) };
    }),
  );

  /** Where the crosshair sits, in the data's own x — undefined when not hovered. */
  let hover = $state<number | undefined>();

  /** Every x a line actually has a point at: the crosshair lands on data, not between it. */
  const stops = $derived([...new Set(points.map(([x]) => x))].sort((a, b) => a - b));

  function nearest(list: [number, number][], to: number) {
    let best: [number, number] | undefined;

    for (const point of list) {
      if (!best || Math.abs(point[0] - to) < Math.abs(best[0] - to)) best = point;
    }

    return best;
  }

  /**
   * The svg scales to its box but keeps the viewBox aspect, so a fraction of the
   * rendered width is the same fraction of `WIDTH` — no measuring beyond that.
   */
  function track(event: PointerEvent) {
    if (!stops.length) return;

    const box = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const at = ((event.clientX - box.left) / box.width) * WIDTH;
    const { x0, x1 } = bounds;
    const wanted = x0 + ((at - PAD.left) / plot.width) * (x1 - x0);

    hover = stops.reduce((best, stop) =>
      (Math.abs(stop - wanted) < Math.abs(best - wanted) ? stop : best));
  }

  const readings = $derived.by(() => {
    if (hover === undefined) return [];

    return series
      .map((line) => ({ line, point: nearest(line.points, hover!) }))
      .filter((reading): reading is { line: Series; point: [number, number] } => !!reading.point);
  });

  /** Past the middle the card would run off the right edge, so it hangs the other way. */
  const flipped = $derived(hover !== undefined && toX(hover) > WIDTH / 2);
</script>

<figure>
  {#if title}
    <figcaption>{title}</figcaption>
  {/if}

  <div class="plot">
    <svg
      viewBox="0 0 {WIDTH} {height}"
      role="img"
      aria-label={title ?? 'chart'}
      onpointermove={track}
      onpointerleave={() => (hover = undefined)}
    >
      {#each yTicks as tick (tick.y)}
        <line class="grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={tick.y} y2={tick.y} />
        <text class="tick" x={PAD.left - 6} y={tick.y + 3} text-anchor="end">{tick.label}</text>
      {/each}

      {#each xTicks as tick (tick.x)}
        <text class="tick" x={tick.x} y={height - 10} text-anchor="middle">{tick.label}</text>
      {/each}

      {#each marks as mark (mark.label)}
        <line class="mark" x1={toX(mark.at)} x2={toX(mark.at)} y1={PAD.top} y2={height - PAD.bottom} />
        <text class="tick mark-label" x={toX(mark.at) + 3} y={PAD.top + 9}>{mark.label}</text>
      {/each}

      {#each series as line (line.label)}
        <polyline
          points={path(line)}
          fill="none"
          stroke={line.color}
          stroke-dasharray={line.dash ?? 'none'}
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      {/each}

      {#if hover !== undefined}
        <line
          class="crosshair"
          x1={toX(hover)} x2={toX(hover)}
          y1={PAD.top} y2={height - PAD.bottom}
        />

        {#each readings as { line, point } (line.label)}
          <circle cx={toX(point[0])} cy={toY(point[1])} r="2.5" fill={line.color} />
        {/each}
      {/if}
    </svg>

    <!-- The swatch is the only name it needs: the legend below spells them out. -->
    {#if hover !== undefined && readings.length}
      <div class={['readout', { flipped }]} style:left="{(toX(hover) / WIDTH) * 100}%">
        <span class="at">{xFormat(hover)}</span>

        {#each readings as { line, point } (line.label)}
          <span class="reading">
            <svg class="swatch" viewBox="0 0 18 6" aria-hidden="true">
              <line
                x1="0" y1="3" x2="18" y2="3"
                stroke={line.color}
                stroke-dasharray={line.dash ?? 'none'}
                stroke-width="1.5"
              />
            </svg>
            {yFormat(point[1])}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="legend">
    {#each series as line (line.label)}
      <span class="key">
        <svg class="swatch" viewBox="0 0 18 6" aria-hidden="true">
          <line
            x1="0" y1="3" x2="18" y2="3"
            stroke={line.color}
            stroke-dasharray={line.dash ?? 'none'}
            stroke-width="1.5"
          />
        </svg>
        {line.label}
      </span>
    {/each}
  </div>
</figure>

<style>
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  figcaption {
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--ink-500);
  }

  .plot {
    position: relative;
  }

  .plot > svg {
    display: block;
    width: 100%;
    height: auto;
    background: var(--surface);
    border: var(--rule-card);
  }

  .crosshair {
    stroke: var(--ink-400);
    stroke-width: 1;
  }

  /* Rides the crosshair: `left` is the same fraction of the box the svg scales by. */
  .readout {
    position: absolute;
    top: var(--sp-2);
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: var(--sp-2);
    padding: var(--sp-1) var(--sp-2);
    background: var(--surface);
    border: var(--rule-card);
    font-size: var(--fs-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-variant-numeric: tabular-nums;
    color: var(--ink-900);
    white-space: nowrap;
    pointer-events: none;
  }

  .readout.flipped {
    transform: translateX(-100%);
    margin-left: calc(var(--sp-2) * -2);
  }

  .at {
    color: var(--ink-400);
  }

  .reading {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
  }

  .grid {
    stroke: var(--line-100);
    stroke-width: 1;
  }

  .tick {
    font-size: 9px;
    fill: var(--ink-300);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .mark {
    stroke: var(--ink-900);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }

  .mark-label {
    fill: var(--ink-500);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-3);
    font-size: var(--fs-xs);
    color: var(--ink-500);
  }

  .key {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
  }

  .swatch {
    width: 18px;
    height: 6px;
    flex: none;
  }
</style>
