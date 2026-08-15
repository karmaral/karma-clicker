<script lang="ts">
  import LabPanel from './LabPanel.svelte';
  import { SWARM_GROUPS, SWARM_PARAMS, type SwarmVisual } from './planet';
  import { swarmLab } from './swarm-lab.svelte';

  let copied = $state(false);

  const current = $derived(swarmLab.current);
  const size = $derived(swarmLab.size);

  /** Counts, not authoring — so they sit above the groups `copy` prints. */
  const counts = [
    { key: 'bands', label: 'Cohorts', min: 1, max: 8 },
    { key: 'per', label: 'Souls each', min: 0, max: 32 },
  ] as const;

  async function copy() {
    await navigator.clipboard.writeText(swarmLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="swarm lab"
  side="left"
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
  {/snippet}
</LabPanel>
