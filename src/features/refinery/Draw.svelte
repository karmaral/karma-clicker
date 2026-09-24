<script lang="ts">
  /**
   * The mechanic itself — see `docs/design.md` §21, *Karma as weight*. The
   * refinery draws a share of the short pile, so a staffed one settles your
   * backlog at `settlesAt` seconds rather than chasing income; every worker and
   * upgrade lowers it. The headline is where it comes to rest, the caption is
   * where you stand now — the gap between the two is the work left.
   *
   * The rate it draws at is Refining's headline, so it is not said again here.
   */
  import { Section } from '$ui';
  import { refinery } from '$lib/refinery.svelte';
  import { weight } from '$lib/weight.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f, formatSpan } from '$lib/utils';

  const isIdle = $derived(refinery.drawers <= 0);
</script>

<Section label="Draw" highlighted={spotlight.isLit('refinery')}>
  {#snippet aside()}
    {f(refinery.drawers)} souls drawing · {f(refinery.slots)} slots
  {/snippet}

  {#if isIdle}
    <p class="held">Unstaffed — nothing is put down.</p>
  {:else}
    <p class="held">Settles your backlog at <strong>{formatSpan(refinery.settlesAt * 1000)}</strong></p>
  {/if}

  <p class="caption">carrying {formatSpan(weight.backlog * 1000)} of karma now</p>
</Section>

<style>
  .held {
    margin: 0;
    font-size: var(--fs-base);
    color: var(--ink-900);
  }

  .held strong {
    font-weight: 600;
  }

  .caption {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
