<script lang="ts">
  import { Label } from '$ui';

  interface Props {
    phases: number;
    current: number;
    position: number;
    /** Fraction of amplitude removed by inertia, 0–1. */
    flatten?: number;
    height?: string;
  }

  let { phases, current, position, flatten = 0, height = '70px' }: Props = $props();

  const H = 70;
  const MID = H / 2;
  const AMP = H * 0.371;

  const W = $derived(phases * 100);
  const seg = $derived(W / phases);

  const r = (n: number) => Math.round(n * 100) / 100;

  const CTRL = (4 / 3) * AMP;

  const scale = $derived(1 - Math.min(1, Math.max(0, flatten)));

  const ctrlY = (i: number, k: number) => MID + (i % 2 === 1 ? CTRL : -CTRL) * k;

  const build = (k: number) => {
    let d = `M0,${MID} C${r(seg / 3)},${r(ctrlY(0, k))} ${r((2 * seg) / 3)},${r(ctrlY(0, k))} ${seg},${MID}`;
    for (let i = 1; i < phases; i++) {
      d += ` S${r(i * seg + (2 * seg) / 3)},${r(ctrlY(i, k))} ${r((i + 1) * seg)},${MID}`;
    }
    return d;
  };

  const path = $derived(build(scale));
  const ghost = $derived(build(1));

  const FLATTEN_FADE_THRESHOLD = 0.15;

  const ghostOpacity = $derived.by(() => {
    const t = Math.min(1, (1 - scale) / FLATTEN_FADE_THRESHOLD);
    return t * t * (3 - 2 * t);
  });

  const markerY = $derived.by(() => {
    const g = position * phases;
    const i = Math.min(phases - 1, Math.floor(g));
    const t = g - i;
    return MID * ((1 - t) ** 3 + t ** 3) + 3 * ctrlY(i, scale) * t * (1 - t);
  });
</script>

<div class="wave" style:height>
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
    {#each { length: phases } as _, i}
      {#if i % 2 === 1 || i === current}
        <rect
          x={i * seg}
          y="0"
          width={seg}
          height={H}
          fill="var(--ink-900)"
          opacity={i === current ? 0.05 : 0.025}
        />
      {/if}
      {#if i > 0}
        <line x1={i * seg} y1="0" x2={i * seg} y2={H} stroke="var(--line-100)" stroke-width="1" />
      {/if}
    {/each}

    <line x1="0" y1={MID} x2={W} y2={MID} stroke="var(--line-100)" stroke-width="1" />
    {#if scale < 1}
      <path
        d={ghost} fill="none" stroke="var(--ink-200)" stroke-width="2"
        stroke-dasharray="8 8" vector-effect="non-scaling-stroke"
        opacity={ghostOpacity}
      />
    {/if}
    <path d={path} fill="none" stroke="var(--ink-900)" stroke-width="1.5" />
    <line
      x1={position * W} y1="0" x2={position * W} y2={H}
      stroke="var(--ink-300)" stroke-width="1" stroke-dasharray="2 3"
      vector-effect="non-scaling-stroke"
    />
    <line
      x1="0" y1={markerY} x2={W} y2={markerY}
      stroke="var(--ink-300)" stroke-width="1" stroke-dasharray="2 3"
      vector-effect="non-scaling-stroke"
    />
  </svg>

  <span class="marker" style:left="{position * 100}%" style:top="{(markerY / H) * 100}%"></span>

  <span class="axis-label top"><Label text="Light" size="sm" /></span>
  <span class="axis-label bottom"><Label text="Dense" size="sm" /></span>
</div>

<style>
  .wave {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .marker {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: inset 0 0 0 1.5px var(--ink-900);
  }

  .axis-label {
    position: absolute;
    left: 0;
    display: flex;
    line-height: 1;
  }

  .axis-label.top { top: 2px; }
  .axis-label.bottom { bottom: 2px; }
</style>
