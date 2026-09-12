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
    /**
     * `ink` masks what it sits on, which is what a meter fill needs. `current`
     * takes the colour it inherits and leaves its own body clear, so a glyph on
     * a button follows that button through its hover.
     */
    tone?: 'ink' | 'current';
    size?: number;
  }

  let { state, tone = 'ink', size = 14 }: Props = $props();

  const body = $derived(tone === 'current' ? 'none' : 'var(--surface)');
  const edge = $derived.by(() => {
    if (tone === 'current') return 'currentColor';

    return state === 'placed' ? 'var(--ink-900)' : 'var(--ink-400)';
  });
</script>

<svg viewBox="0 0 14 14" width={size} height={size} aria-hidden="true">
  {#if state === 'placed'}
    <polygon
      points="5.96,2.8 8.04,2.8 11.16,8.2 10.12,10 3.88,10 2.84,8.2"
      fill={body} stroke={edge} stroke-width="1" stroke-linejoin="miter"
    />
    <polygon points="6.55,5.17 7.45,5.17 8.81,7.52 8.36,8.31 5.64,8.31 5.19,7.52" fill={edge} />
  {:else}
    <polygon
      points="5.96,2.8 8.04,2.8 11.16,8.2 10.12,10 3.88,10 2.84,8.2"
      fill={body} stroke={edge} stroke-width="1"
      stroke-dasharray="3.1 1" stroke-dashoffset="-1.7" stroke-linejoin="miter"
    />
  {/if}
</svg>
