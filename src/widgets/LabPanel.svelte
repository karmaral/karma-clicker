<script lang="ts">
  import type { Snippet } from 'svelte';

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
          <label class="row">
            <span class="id">{param.label}</span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={value(param.key)}
              oninput={(e) => set(param.key, Number(e.currentTarget.value))}
              ondblclick={() => reset(param.key)}
            />
            <span class="num">{Number(value(param.key).toFixed(3))}</span>
          </label>

          {@render under?.(param.key)}
        {/each}
      {/each}
    </div>
  {/if}
</aside>

<style>
  /* A panel is laid out by its rail, so it owns no position of its own — which
     is what lets two of them share a side. */
  .lab {
    width: 20rem;
    display: flex;
    flex-direction: column;
    /* Open panels share the rail's height; without this the scrolling body
       cannot shrink and the last panel falls off the page. */
    flex: 1 1 auto;
    min-height: 0;
    background: var(--surface);
    border: var(--rule-card);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
  }

  .lab:not(.open) {
    flex: none;
    width: auto;
    align-self: flex-start;
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

  .num {
    flex: none;
    width: 3rem;
    text-align: right;
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }

  .body :global(input[type='range']),
  input[type='range'] {
    flex: 1;
    min-width: 0;
    accent-color: var(--ink-900);
  }

  /* The rows a lab renders into `header`/`under` are styled from here too, so
     the two panels cannot drift apart. */
  .body :global(.row),
  .row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .body :global(.id),
  .id {
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
