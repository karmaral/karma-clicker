<script lang="ts">
  /**
   * The anchor, in the two states `docs/progression.md` (*Anchors on the
   * surface*) already settled: a fill and its absence. Placed is the solid
   * with its edges; pending is the same edges, dashed, hollow. Inlined rather
   * than the `src/assets/anchor-*.svg` pair it is drawn from — those hardcode
   * their colours, and this one has to sit on `theme="dark"` Meter fills.
   */
  interface Props {
    state: 'pending' | 'placed';
  }

  let { state }: Props = $props();
</script>

<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
  {#if state === 'placed'}
    <polygon
      points="5.96,2.8 8.04,2.8 11.16,8.2 10.12,10 3.88,10 2.84,8.2"
      fill="var(--surface)" stroke="var(--ink-900)" stroke-width="1" stroke-linejoin="miter"
    />
    <polygon points="6.55,5.17 7.45,5.17 8.81,7.52 8.36,8.31 5.64,8.31 5.19,7.52" fill="var(--ink-900)" />
  {:else}
    <polygon
      points="5.96,2.8 8.04,2.8 11.16,8.2 10.12,10 3.88,10 2.84,8.2"
      fill="var(--surface)" stroke="var(--ink-400)" stroke-width="1"
      stroke-dasharray="3.1 1" stroke-dashoffset="-1.7" stroke-linejoin="miter"
    />
  {/if}
</svg>
