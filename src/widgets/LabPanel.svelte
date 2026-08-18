<script lang="ts">
  import type { Snippet } from 'svelte';
  import Slider from './Slider.svelte';

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
    /** Rows above the sliders — whatever this lab is per-subject about. */
    header?: Snippet;
    /** Extra control belonging to one slider, drawn directly under it. */
    under?: Snippet<[string]>;
  }

  let { title, groups, params, value, set, reset, header, under }: Props = $props();

  let open = $state(true);

  function paramsIn(group: string) {
    return params.filter((param) => param.group === group);
  }
</script>

<aside class={['lab', { open }]}>
  <button class="toggle" onclick={() => (open = !open)}>{title}</button>

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

  /* An open panel takes the **whole** rail and covers whatever else is in it.
     Four subjects sharing one column left every one of them too short to work
     in; a rail is one subject at a time, and minimising is how you choose which.
     The closed ones are their title bars alone, in flow underneath. */
  .lab.open {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .lab:not(.open) {
    flex: none;
  }

  .toggle {
    background: var(--ink-900);
    color: var(--surface);
    border: none;
    padding: var(--sp-2) var(--sp-3);
    cursor: pointer;
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
    cursor: pointer;
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
