<script lang="ts">
  /**
   * State, not quantity. How far the unpaired difference has carried you off
   * centre, and where the door out of this world sits. The bars say how big the
   * piles are; nothing here repeats that.
   */
  import Label from './Label.svelte';

  interface Props {
    /** Signed excess, 1 = a whole wall's worth. Negative is Burden. */
    value: number;
    /** The first-harvest gate, a magnitude — the planet asks for |excess| under it. */
    gate?: number;
    /** The side's own word, so the meter never re-derives what labels.ts owns. */
    side?: string;
  }

  let { value, gate, side }: Props = $props();

  /** Both ends are a full wall out. Past that the reading is pinned, not lost. */
  const SPAN = 1;

  const at = (x: number) => `${((Math.max(-SPAN, Math.min(SPAN, x)) + SPAN) / (SPAN * 2)) * 100}%`;

  const isComfort = $derived(value > 0);

  const slugFrom = $derived(isComfort ? at(0) : at(value));
  const slugTo = $derived(isComfort ? at(value) : at(0));

  const figure = $derived(`${isComfort ? '+' : '−'}${Math.abs(Math.round(value * 100))}%`);
</script>

<div class="excess">
  <div class="readout">
    <span class="reading">
      <Label text={side ?? 'Excess'} size="sm" />
      <span class="num">{figure}</span>
    </span>
    {#if gate !== undefined}
      <span class="reading gate">
        <Label text="Gate" size="sm" />
        <span class="num">±{Math.round(gate * 100)}%</span>
      </span>
    {/if}
  </div>

  <div class="track">
    <span
      class={['slug', isComfort ? 'pos' : 'neg']}
      style:left={slugFrom}
      style:right="calc(100% - {slugTo})"
    ></span>

    <!-- The gate is |excess| under a threshold, so it is a doorway with two
         posts, never one tick on one side. -->
    {#if gate !== undefined}
      <span class="post" style:left={at(-gate)}></span>
      <span class="post" style:left={at(gate)}></span>
    {/if}

    <span class="zero" style:left={at(0)}></span>
    <span class="wall start"></span>
    <span class="wall end"></span>
  </div>
</div>

<style>
  .excess {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }

  .readout {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
  }

  .reading {
    display: flex;
    align-items: baseline;
    gap: var(--sp-1);
    white-space: nowrap;
  }

  .reading .num {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
    font-weight: 700;
    color: var(--ink-900);
  }

  .reading.gate .num { color: var(--ink-200); }

  .track {
    position: relative;
    height: 14px;
    background: var(--line-100);
  }

  .slug {
    position: absolute;
    top: 0;
    bottom: 0;
    display: block;
  }

  .slug.neg { background: var(--hatch-neg-bar); }

  .slug.pos {
    background: var(--hatch-pos-bar);
    box-shadow: var(--hatch-pos-edge);
  }

  .post,
  .zero,
  .wall {
    position: absolute;
    display: block;
  }

  .post {
    top: -6px;
    bottom: -6px;
    width: 2px;
    background: var(--ink-900);
  }

  /* A riser above each post, so the doorway reads over the slug crossing it. */
  .post::after {
    content: '';
    position: absolute;
    left: 0;
    top: -4px;
    width: 2px;
    height: 4px;
    background: var(--ink-900);
  }

  .zero {
    top: -4px;
    bottom: -4px;
    width: 1px;
    background: var(--ink-900);
  }

  .wall {
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: var(--ink-900);
  }

  .wall.start { left: 0; }
  .wall.end { right: 0; }
</style>
