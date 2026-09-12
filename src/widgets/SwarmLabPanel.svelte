<script lang="ts">
  import LabPanel from './LabPanel.svelte';
  import { SWARM_GROUPS, SWARM_PARAMS, type SwarmVisual } from './planet';
  import { swarmLab } from './swarm-lab.svelte';

  let copied = $state(false);

  const current = $derived(swarmLab.current);
  const size = $derived(swarmLab.size);
  const stage = $derived(swarmLab.stage);

  /**
   * Counts, not authoring — so they sit above the groups `copy` prints.
   * `Streaming` is how many of the inner bands have collapsed into a rate; it
   * is the only way to see what `Bolt` does to a band that no longer strikes on
   * its payouts, since nothing in the lab is earning.
   *
   * `Working` is the crew on the anchor going down, which only the Anchors
   * section has a ghost to stand them on.
   */
  const counts = [
    { key: 'bands', label: 'Cohorts', min: 1, max: 8 },
    { key: 'per', label: 'Souls each', min: 0, max: 100 },
    { key: 'streams', label: 'Streaming', min: 0, max: 8 },
    { key: 'working', label: 'Working', min: 0, max: 60 },
  ] as const;

  /**
   * The harvest cell's framing: two pixel measures and one position. Not printed
   * either — these are the screen's numbers, and they go back into `visual.ts`
   * by hand. `Anchor` stops at 50 because that is the middle; past it the world
   * would sit under the controls rather than above them.
   */
  const stageRows = [
    { key: 'radius', label: 'World px', min: 60, max: 320 },
    { key: 'room', label: 'Room px', min: 240, max: 900 },
    { key: 'anchor', label: 'Anchor %', min: 0, max: 50 },
  ] as const;

  async function copy() {
    await navigator.clipboard.writeText(swarmLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="swarm lab"
  groups={SWARM_GROUPS}
  params={SWARM_PARAMS}
  value={(key) => current[key as keyof SwarmVisual]}
  set={(key, value) => swarmLab.set(key as keyof SwarmVisual, value)}
  reset={(key) => swarmLab.reset(key as keyof SwarmVisual)}
>
  {#snippet header()}
    <div class="row">
      <span class="id">seed {current.seed}</span>
      <button onclick={() => swarmLab.reseed()}>reseed</button>
      <button onclick={() => swarmLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>

    {#each counts as count (count.key)}
      <label class="row">
        <span class="id">{count.label}</span>
        <input
          type="range"
          min={count.min}
          max={count.max}
          step="1"
          value={size[count.key]}
          oninput={(e) => swarmLab.resize(count.key, Number(e.currentTarget.value))}
        />
        <span class="num">{size[count.key]}</span>
      </label>
    {/each}

    {#each stageRows as row (row.key)}
      <label class="row">
        <span class="id">{row.label}</span>
        <input
          type="range"
          min={row.min}
          max={row.max}
          step="1"
          value={stage[row.key]}
          oninput={(e) => swarmLab.restage(row.key, Number(e.currentTarget.value))}
        />
        <span class="num">{stage[row.key]}</span>
      </label>
    {/each}

    <!-- Counts too, and off by default — a swarm with no split is the state
         every screen but Harvest is in, and `Settle at` / `Stray to` say
         nothing until there is one. -->
    <label class="row">
      <span class="id">Split</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={swarmLab.merge ?? 0}
        disabled={swarmLab.merge === undefined}
        oninput={(e) => swarmLab.setMerge(Number(e.currentTarget.value))}
      />
      <button onclick={() => swarmLab.setMerge(swarmLab.merge === undefined ? 0.5 : undefined)}>
        {swarmLab.merge === undefined ? 'off' : 'on'}
      </button>
    </label>

    <!-- `Riders` is a share and the harness is bought a soul at a time, so the
         number that matters is the one the share came out as. The split is the
         same kind of figure and reads beside it. -->
    <div class="row">
      <span class="id">
        {swarmLab.riders} of {swarmLab.souls} riding{#if swarmLab.staying !== undefined}
          · {swarmLab.staying} staying{/if}
      </span>
    </div>
  {/snippet}
</LabPanel>
