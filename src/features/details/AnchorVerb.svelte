<script lang="ts">
  /**
   * The world's offer, taken or given back. It rides the planet viewport's own
   * top-right corner because the offer is made *by the world you are looking at*
   * — the Harness tab is what the rig is, not where a job is begun.
   *
   * A pill, not a column verb: the harvest is the door out and keeps the one
   * full-width button at the foot. This is a thing you may do while you are
   * here, so it sits on the world instead of under it.
   *
   * Cancelling forfeits every anchor placed, so it asks twice. The confirm is on
   * the button itself rather than in a dialog — one press is not enough and a
   * modal over a running job is more ceremony than the loss deserves.
   */
  import type { Props as TippyProps } from 'tippy.js';
  import { AnchorGlyph, Tooltip, tooltip } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { harness } from '$lib/harness.svelte';
  import { f } from '$lib/utils';
  import planetTexts from '$data/planets-texts';

  const planet = $derived(PlanetManager.getActive());

  const name = $derived(planet ? planetTexts[planet.id]?.title ?? planet.id : '');

  /** Drawn only where there is an offer left to take or give back. */
  const isOffered = $derived(
    progression.isRevealed('details.field') && harness.isAnchorable && !harness.isAnchored,
  );

  const isActive = $derived(Boolean(planet?.isAnchorJobActive));

  let isConfirming = $state(false);

  /** A world switched under the button must not inherit a half-pressed cancel. */
  $effect(() => {
    PlanetManager.selected;
    isConfirming = false;
  });

  const bonus = $derived(
    planet ? `+${Math.round(planet.anchorBonus * harness.anchorsAsked * 100)}%` : '',
  );

  /** Short enough to sit over the disc — the world's name moves to the hover. */
  const label = $derived.by(() => {
    if (!isActive) return 'Anchor';

    return isConfirming ? 'Confirm cancel' : 'Cancel';
  });

  /** The reading the old stacked sub carried, now one line on hover. */
  const hint = $derived.by(() => {
    if (!isActive) {
      return `Anchor ${name} · ${f(harness.anchorsAsked)} anchors · ${bonus} yields`;
    }

    const placed = `${f(harness.anchorsPlaced)} of ${f(harness.anchorsAsked)}`;

    return isConfirming ? `Forfeits ${placed}` : `${placed} down`;
  });

  let hintElem: HTMLElement | undefined = $state();
  const hintOptions: Partial<TippyProps> = { placement: 'bottom-end', delay: [120, 0] };

  function onclick() {
    if (!isActive) {
      harness.beginJob();
      return;
    }

    if (!isConfirming) {
      isConfirming = true;
      return;
    }

    harness.cancelJob();
    isConfirming = false;
  }
</script>

{#if isOffered}
  <button
    type="button"
    class={['verb', { confirming: isConfirming }]}
    disabled={!progression.isLive('details.field')}
    {onclick}
    {@attach tooltip({ content: hintElem, options: hintOptions })}
  >
    <div class="hint-wrapper" bind:this={hintElem}>
      <Tooltip hint>{hint}</Tooltip>
    </div>

    <AnchorGlyph state={isActive ? 'placed' : 'pending'} tone="current" size={13} />
    <span class="label">{label}</span>

    <!-- Underlined rather than filled left-to-right: the pill is small and the
         word on it has to stay readable the whole way across. -->
    {#if isActive}
      <span class="progress" style:width="{Math.max(0, Math.min(100, harness.anchorFill * 100))}%"
      ></span>
    {/if}
  </button>
{/if}

<style>
  /* Pinned to the viewport it is drawn over — see `DetailsScreen`'s `.staged`. */
  .verb {
    position: absolute;
    top: var(--sp-2);
    right: var(--sp-2);
    z-index: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
    background: var(--surface);
    color: var(--ink-900);
    border: 1px solid var(--ink-900);
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  }

  .label {
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1.2;
  }

  .progress {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    background: var(--res-xp);
    transition: width var(--t-fast) linear;
  }

  .verb:hover:not(:disabled),
  .verb:active:not(:disabled) {
    background: var(--res-xp);
    color: var(--ink-inverse);
    border-color: var(--res-xp);
  }

  /* The second press is the destructive one, so it stops asking quietly. */
  .verb.confirming {
    background: var(--ink-900);
    color: var(--ink-inverse);
  }

  .verb:disabled {
    color: var(--ink-300);
    border-color: var(--line-200);
  }

  .hint-wrapper { pointer-events: none; }
</style>
