<script lang="ts">
  import { anchorLab } from './anchor-lab.svelte';
  import { harnessLab } from './harness-lab.svelte';
  import LabPanel from './LabPanel.svelte';
  import {
    countLinks, countLoops, HARNESS_GROUPS, HARNESS_PARAMS, nodesFor, type HarnessVisual,
  } from './planet';

  let copied = $state(false);

  const current = $derived(harnessLab.current);

  /** The placed nodes, as the scene picks them — so the count here is the drawn one. */
  const strung = $derived(
    nodesFor(anchorLab.size.count, anchorLab.current.phase)
      .filter((node, i) => anchorLab.anchored[i]),
  );

  /**
   * What density actually bought. Loops per family falls as families multiply,
   * so the slider's own number does not say how full a harness came out — and
   * `span` decides how many families there are to divide by.
   */
  const drawn = $derived(countLoops(current, strung));
  const linked = $derived(countLinks(current, strung));

  async function copy() {
    await navigator.clipboard.writeText(harnessLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="harness lab"
  groups={HARNESS_GROUPS}
  params={HARNESS_PARAMS}
  value={(key) => current[key as keyof HarnessVisual]}
  set={(key, value) => harnessLab.set(key as keyof HarnessVisual, value)}
  reset={(key) => harnessLab.reset(key as keyof HarnessVisual)}
>
  {#snippet header()}
    <div class="row">
      <span class="id">{strung.length} strung</span>
      <button onclick={() => harnessLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>

    <div class="row">
      <span class="id">{linked} linked · {drawn} loops</span>
    </div>
  {/snippet}
</LabPanel>