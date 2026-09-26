<script lang="ts">
  /**
   * The refinery's learning split — see `docs/design.md` §18. A share of
   * experience income becomes knowledge, at a worsening rate. The pile reads
   * here and nowhere else; its shelves open in a window from the aside.
   */
  import { Reading, SliderBar, Section, Value } from '$ui';
  import { ResourceManager } from '$lib/managers';
  import { READING_LABELS } from '$lib/labels';
  import { progression } from '$lib/progression';
  import { knowledge } from '$lib/knowledge.svelte';
  import { getExperienceIncome } from '$lib/income';
  import { f, formatRate } from '$lib/utils';
  import { catalogue } from '$features/frame/upgrades.svelte';

  const income = $derived(getExperienceIncome());
  const diverted = $derived(income * knowledge.share);
  const rate = $derived(knowledge.rateFor(income));
  const held = $derived(ResourceManager.getAmount('knowledge'));
</script>

{#if progression.isRevealed('refinery.knowledge')}
  <Section label="Learning split">
    {#snippet aside()}
      <button type="button" class="escape" onclick={catalogue.openShelves}>shelves →</button>
    {/snippet}

    <Reading label={READING_LABELS.knowledge}>
      <Value
        kind="knowledge"
        value={f(held)}
        muted={!held}
        size="lg"
        rate={formatRate(rate)}
      />
    </Reading>

    <SliderBar
      value={knowledge.share}
      ceiling={1}
      step={knowledge.step}
      label="Learning split"
      onchange={(share) => knowledge.setShare(share)}
    />

    <p class="caption">
      {#if diverted > 0}
        {f(knowledge.share * 100)}% of experience · {formatRate(diverted)} xp/s
      {:else}
        nothing diverted
      {/if}
      · next costs {f(knowledge.price)} xp
    </p>
  </Section>
{/if}

<style>
  .caption {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  /* The rail's escape, in a section's aside. */
  .escape {
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    border-bottom: 1px solid var(--ink-900);
    white-space: nowrap;
  }

  .escape:hover {
    color: var(--ink-500);
    border-bottom-color: var(--ink-500);
  }
</style>
