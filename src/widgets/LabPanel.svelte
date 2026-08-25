<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import Slider from './Slider.svelte';
  import { RAIL, type Rail } from './lab-rail';

  /** Structurally what `VisualParam` and `SwarmParam` already are. */
  interface LabParam {
    key: string;
    label: string;
    group: string;
    min: number;
    max: number;
    step: number;
  }

  interface Props {
    title: string;
    groups: string[];
    params: LabParam[];
    /**
     * Read as a call rather than handed the record: the two labs hold different
     * shapes, and an accessor keeps the reactive read at the row that uses it.
     */
    value: (key: string) => number;
    set: (key: string, value: number) => void;
    reset: (key: string) => void;
    /** Which rows have moved. A lab with no defaults to compare against omits it. */
    changed?: (key: string) => boolean;
    /** Rows above the sliders — whatever this lab is per-subject about. */
    header?: Snippet;
    /** Extra control belonging to one slider, drawn directly under it. */
    under?: Snippet<[string]>;
  }

  let { title, groups, params, value, set, reset, changed, header, under }: Props = $props();

  /** In a rail, which panel is open is the rail's call; standing alone it is ours. */
  const rail = getContext<Rail | undefined>(RAIL);
  const id = Symbol();

  rail?.claim(id);

  let alone = $state(true);

  const open = $derived(rail ? rail.isOpen(id) : alone);

  function toggle() {
    if (rail) rail.toggle(id);
    else alone = !alone;
  }

  function paramsIn(group: string) {
    return params.filter((param) => param.group === group);
  }
</script>

<aside class={['lab', { open }]}>
  <button class="toggle" onclick={toggle}>{title}</button>

  {#if open}
    <div class="body">
      {@render header?.()}

      {#each groups as group (group)}
        <p class="group">{group}</p>

        {#each paramsIn(group) as param (param.key)}
          <Slider
            label={param.label}
            min={param.min}
            max={param.max}
            step={param.step}
            value={value(param.key)}
            set={(next) => set(param.key, next)}
            reset={() => reset(param.key)}
            changed={changed?.(param.key)}
          />

          {@render under?.(param.key)}
        {/each}
      {/each}
    </div>
  {/if}
</aside>

<style>
  .lab {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: var(--rule-card);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
  }

  /* An open panel takes everything the other title bars leave. Four subjects
     sharing the column evenly left every one of them too short to work in, and
     covering the rail with the open one left no sign the others existed — so
     the closed ones stay in flow as their bars, and the rail keeps one open. */
  .lab {
    flex: none;
  }

  .lab.open {
    flex: 1 1 auto;
    min-height: 0;
    align-self: stretch;
  }

  .toggle {
    background: var(--ink-900);
    color: var(--surface);
    border: none;
    padding: var(--sp-2) var(--sp-3);
    font: inherit;
    text-align: left;
    flex: none;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    padding: var(--sp-3);
    /* Takes what the title bar leaves and scrolls inside it — without the
       `min-height` a long list of sliders grows the panel past the rail. */
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }

  .group {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--ink-900);
    border-bottom: var(--rule-row);
    padding-bottom: 2px;
  }

  .body :global(input[type='range']) {
    flex: 1;
    min-width: 0;
    accent-color: var(--ink-900);
  }

  /* `Slider`'s row and the ones a lab renders into `header`/`under` are all
     styled from here, so no panel can drift from another. */
  .body :global(.row) {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  /* A moved row comes up to full ink and grows a rule in the panel's padding —
     a column you can run an eye down, without a colour the lab does not have. */
  .body :global(.row.changed) {
    margin-left: calc(var(--sp-3) * -1);
    padding-left: calc(var(--sp-3) - 2px);
    border-left: 2px solid var(--ink-900);
  }

  .body :global(.row.changed .id),
  .body :global(.row.changed .num) {
    color: var(--ink-900);
  }

  .body :global(.id) {
    flex: none;
    width: 7rem;
    color: var(--ink-400);
    white-space: nowrap;
  }

  .body :global(.num) {
    flex: none;
    width: 3rem;
    text-align: right;
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }

  /* `.pick` is excluded rather than overridden — its selected state kept losing. */
  .body :global(button:not(.puck):not(.pick)),
  .body :global(.pick) {
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
    font: inherit;
  }

  .body :global(button:not(.puck):not(.pick):hover),
  .body :global(.pick:hover) {
    background: var(--surface-alt);
  }

  .body :global(.pick.on),
  .body :global(.pick.on:hover) {
    background: var(--ink-900);
    color: var(--surface);
    border-color: var(--ink-900);
  }
</style>
