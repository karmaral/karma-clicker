<script lang="ts">
  import { anchorLab } from './anchor-lab.svelte';
  import LabPanel from './LabPanel.svelte';
  import { ANCHOR_GROUPS, ANCHOR_PARAMS, type AnchorVisual } from './planet';

  let copied = $state(false);

  const current = $derived(anchorLab.current);
  const size = $derived(anchorLab.size);

  /** What the count is a picture of. Named so a wrong figure is caught by eye. */
  const FIGURES = [
    '—', 'single', 'antipodal', 'triangle', 'tetrahedron',
    'triangular bipyramid', 'octahedron', 'pentagonal bipyramid', 'square antiprism',
  ];

  /** Counts and states, not authoring — so they sit above the groups `copy` prints. */
  const counts = [
    { key: 'count', label: 'Anchors', min: 1, max: 8 },
    { key: 'placed', label: 'Placed', min: 0, max: 8 },
  ] as const;

  async function copy() {
    await navigator.clipboard.writeText(anchorLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="anchor lab"
  groups={ANCHOR_GROUPS}
  params={ANCHOR_PARAMS}
  value={(key) => current[key as keyof AnchorVisual]}
  set={(key, value) => anchorLab.set(key as keyof AnchorVisual, value)}
  reset={(key) => anchorLab.reset(key as keyof AnchorVisual)}
>
  {#snippet header()}
    <div class="row">
      <span class="id">{FIGURES[size.count]}</span>
      <button onclick={() => anchorLab.revert()}>revert</button>
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
          oninput={(e) => anchorLab.resize(count.key, Number(e.currentTarget.value))}
        />
        <span class="num">{size[count.key]}</span>
      </label>
    {/each}
  {/snippet}
</LabPanel>