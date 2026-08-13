<script lang="ts">
  /**
   * A takeover, not a fourth tab. One verb, and the split that arms it — your
   * own count drops as you drag, so the cost is felt rather than explained.
   */
  import { Button, Section } from '$ui';
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { getFirstHarvestPolarity } from '$lib/excess';
  import { FIRST_HARVEST_POLARITY_LABELS, getFirstHarvestConditionLabel } from '$lib/labels';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import { pulse } from '$lib/loop';
  import RevealStub from '../RevealStub.svelte';
  import planetTexts from '$data/planets-texts';

  interface Props {
    onclose?: () => void;
  }

  let { onclose }: Props = $props();

  /** One global fraction across every cohort — you never choose which flavour goes. */
  let mergedPercent = $state(50);

  const mergeFraction = $derived(mergedPercent / 100);

  const planet = $derived(PlanetManager.getActive());
  const name = $derived(planetTexts[planet?.id ?? '']?.title ?? '—');

  const souls = $derived(BuildingManager.countSouls());
  const merged = $derived(BuildingManager.countMergeable(mergeFraction));
  const kept = $derived(souls - merged);

  const polarity = $derived(FIRST_HARVEST_POLARITY_LABELS[getFirstHarvestPolarity()]);

  const blockers = $derived(
    (planet?.unmetFirstHarvestConditions ?? []).map((condition) =>
      getFirstHarvestConditionLabel(condition, planet?.data.firstHarvest[condition] ?? 0),
    ),
  );

  function completeFirstHarvest() {
    PlanetManager.completeFirstHarvest(mergeFraction);
    pulse();
    onclose?.();
  }
</script>

<div class="first-harvest">
  <Section label="First harvest" title={name}>
    {#snippet aside()}
      {polarity}
    {/snippet}

    <RevealStub
      name="harvest.disc"
      note="the departure disc — wanted, not yet mocked (§6)"
      height="180px"
    />

    {#if progression.isRevealed('harvest.split')}
      <div class="split">
        <input
          type="range"
          min="0"
          max="100"
          bind:value={mergedPercent}
          disabled={!progression.isLive('harvest.split')}
          aria-label="Souls to merge"
        />
        <div class="counts">
          <span><b class="num">{f(merged)}</b> merged</span>
          <span><b class="num">{f(kept)}</b> kept</span>
        </div>
      </div>
    {/if}

    {#if progression.isRevealed('harvest.outcomes')}
      <ul class="outcomes">
        <li>
          Merged souls stop being yours. {name} keeps incarnating without you,
          paying <b>{polarity.toLowerCase()}</b> for good.
        </li>
        <li>Kept souls come with you, and are all you start the next planet with.</li>
      </ul>
    {/if}

    {#if progression.isRevealed('harvest.verb')}
      <div class="verb">
        <Button
          label="Leave for good"
          sub={blockers.length ? `Needs ${blockers.join(' · ')}` : `${f(merged)} merged`}
          disabled={!planet?.isFirstHarvestReady}
          onclick={completeFirstHarvest}
        />
        <Button label="Not yet" variant="outline" onclick={() => onclose?.()} />
      </div>
    {/if}
  </Section>
</div>

<style>
  .first-harvest {
    display: flex;
    flex-direction: column;
    padding: var(--sp-5) var(--sp-4);
    min-width: 0;
  }

  .split {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }

  .split input {
    width: 100%;
    accent-color: var(--ink-900);
    cursor: pointer;
  }

  .split input:disabled {
    cursor: default;
  }

  .counts {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-4);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .counts b {
    color: var(--ink-900);
    font-weight: 600;
  }

  .outcomes {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }

  .outcomes b {
    color: var(--ink-900);
    font-weight: 600;
  }

  .verb {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--sp-3);
  }
</style>
