<script lang="ts">
  /** One world behind you: what it just sent, the clock to the next batch, and
   * the sweep that clock is keeping. */
  import { Badge, SweepBar } from '$ui';
  import { spotlight } from '$lib/spotlight.svelte';
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';
  import { f, formatClock } from '$lib/utils';
  import { badgeFor } from '../details/badge';
  import type { Listener } from '$lib/emission';
  import type Planet from '$lib/planets/base.svelte';
  import type { ResourceType } from '$types';

  interface Props {
    id: string;
    planet: Planet;
    selected: string;
    stillPx: number;
    /** Passed in, not owned: one clock for the band rather than one per world. */
    now: number;
    onpick: (id: string) => void;
  }

  let { id, planet, selected, stillPx, now, onpick }: Props = $props();

  const ROW_FRAME = 2.2;

  const deliveries = $derived.by(() => {
    const yields = planet.harvestYields;

    return (Object.keys(yields) as ResourceType[]).map((type) => ({ type, amount: yields[type] ?? 0 }));
  });

  /** Blank rather than 00:00 on a world that pays once and has nothing pending. */
  const countdown = $derived.by(() => {
    const nextAt = planet.emitter?.nextAt ?? 0;
    if (!nextAt || !planet.harvestDuration) return '';

    return formatClock(nextAt - now);
  });

  /** Read once — a reactive resume would re-seed the sweep on every tick. */
  const resume = { duration: planet.harvestDuration, remaining: (planet.emitter?.nextAt ?? 0) - Date.now() };

  const subscribe: (fn: Listener) => () => void = (fn) => {
    planet.emitter?.addListener('queue', fn);

    return () => planet.emitter?.removeListener('queue', fn);
  };
</script>

<li>
  <button
    type="button"
    class={['row', { selected: id === selected, lit: spotlight.isLit('planet', id) }]}
    onclick={() => onpick(id)}
  >
    <PlanetStill visual={planetVisuals[id] ?? DEFAULT_VISUAL} widthPx={stillPx} frame={ROW_FRAME} />
    <span class="name">{planetTexts[id]?.title ?? id}</span>
    <SweepBar {subscribe} height="3px" {resume} />
    <span class="num clock">{countdown}</span>
    <span class="deliveries">
      {#each deliveries as delivery (delivery.type)}
        <span class="rate">
          <Badge kind={badgeFor(delivery.type)} />
          <span class="num">{f(delivery.amount)}</span>
        </span>
      {:else}
        <span class="none">nothing yet</span>
      {/each}
    </span>
  </button>
</li>

<style>
  /* The subgrid chain: the ledger's columns pass through the <li> — a plain
     grid item with no `grid-column` of its own would take a single implicit
     cell — down to the button, which is what actually lays the row out. */
  li {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }

  .row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
    column-gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    border-bottom: var(--rule-row);
    text-align: left;
  }

  .row.selected,
  .row.lit {
    background: var(--surface-alt);
  }

  /* The column is sized to the bar's own 12rem, but right-aligned rather than
     stretched — a sweep filling every row's slack width would read as one
     mismatched pace per row instead of one shared length. */
  .row :global(.sweep) {
    justify-self: end;
  }

  .name {
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--ink-900);
  }

  .clock {
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    margin-right: var(--sp-4);
  }

  .deliveries {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--sp-1) var(--sp-3);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-weight: 500;
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .none {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
