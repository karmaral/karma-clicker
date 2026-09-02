<script lang="ts">
  /**
   * The row's whole derivation, base to paid — everything `CohortRow` used to
   * hover-gate into a 200px cell, now the entire content of its tooltip instead.
   * Priced at the table's current purchase mode, so the panel needs no button
   * hover of its own to be complete.
   */
  import { Badge } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { aim, DETENTS } from '$lib/aim';
  import { f, formatCost, formatRounded } from '$lib/utils';
  import texts from '$data/buildings-texts';
  import type Building from '$lib/buildings/base.svelte';
  import type { YieldType } from '$types';
  import type { PurchaseMode } from './types';
  import RateFigure from './RateFigure.svelte';
  import { badgeFor, byRateOrder } from './badge';
  import { resolvePurchasable } from './purchase';

  interface Props {
    cohort: Building;
    purchaseMode: PurchaseMode;
  }

  let { cohort, purchaseMode }: Props = $props();

  const HARDEST_POSITIVE = DETENTS[DETENTS.length - 1];

  const text = $derived(texts[cohort.id]);
  const isSplit = $derived(progression.runs('negKarma'));
  const aimed = $derived(aim.resolve(cohort.data));
  const planet = $derived(PlanetManager.getActive());

  const quantity = $derived(resolvePurchasable(cohort, purchaseMode));
  const cost = $derived(cohort.getCost(quantity) ?? 0);

  const activeCount = $derived(cohort.activeAt(cohort.count));
  const heldBack = $derived(cohort.count - activeCount);

  const yields = $derived(
    (Object.keys(cohort.production) as YieldType[]).sort(byRateOrder),
  );

  /** One line per figure — the row's old preview logic, now always on. */
  function ratesAt(count: number) {
    return yields.flatMap((type) => {
      if (type !== 'karma') return [{ type, value: cohort.perSecond(type, count) }];

      const now = cohort.karmaPerSecond(count);
      if (!isSplit) return [{ type, value: now.positive }];

      return [
        { type: 'karma_negative' as YieldType, value: now.negative },
        { type: 'karma_positive' as YieldType, value: now.positive },
      ];
    });
  }

  const now = $derived(ratesAt(cohort.count));
  const after = $derived(ratesAt(cohort.count + quantity));

  const showChain = $derived(isSplit && yields.includes('karma'));

  /** Same formula `Aim#resolve` prices — kept apart so extremity and the re-aim
      penalty can be shown as the two separate multipliers they are. */
  const extremityPayoff = $derived.by(() => {
    const { polarity_multiplier = 1 } = cohort.data;
    const extremity = Math.abs(aimed.realizedAim) / HARDEST_POSITIVE;

    return 1 + extremity * (polarity_multiplier - 1);
  });

  const positivePercent = $derived(Math.round(aimed.positiveShare * 100));
</script>

<div class="cohort-tip">
  <div class="title">{text?.title ?? cohort.id}</div>
  {#if text?.description}
    <div class="description">{text.description}</div>
  {/if}

  <div class="base">
    {#each yields as type (type)}
      <div class="line">
        <span class="label">
          <Badge kind={badgeFor(type)} />
          {f(cohort.production[type] ?? 0)} each · {f(cohort.duration / 1000)}s
          {#if heldBack > 0}· ×{f(activeCount)}{/if}
        </span>
        <span class="num">+{f(cohort.perSecond(type))}/s</span>
      </div>
    {/each}
  </div>

  {#if showChain || cohort.yieldScale !== 1 || heldBack > 0}
    <hr class="rule" />

    {#if showChain}
      <div class="line">
        <span class="label">aim</span>
        <span class="num">{f(aimed.realizedAim, 2)} · {aim.leanFor(aimed)}</span>
      </div>
      <div class="line">
        <span class="label">split</span>
        <span class="num">{100 - positivePercent} / {positivePercent}</span>
      </div>
      <div class="line">
        <span class="label">extremity</span>
        <span class="num">
          ×{f(extremityPayoff, 2)}
          <span class="dim">bias {cohort.data.polarity_bias ?? 0} · resist {f(cohort.data.resistance ?? 0, 2)}</span>
        </span>
      </div>
      {#if planet}
        <div class="line">
          <span class="label">wave</span>
          <span class="num">
            {planet.isDense ? 'dense' : 'light'}
            <span class="dim">⊖ ×{f(planet.bias(false), 2)} ⊕ ×{f(planet.bias(true), 2)}</span>
          </span>
        </div>
      {/if}
      {#if aim.phasesOwed > 0}
        <div class="line">
          <span class="label">re-aim</span>
          <span class="num">−{Math.round(aim.reaimPenalty * 100)}%, {formatRounded(aim.phasesOwed, 1)} phases left</span>
        </div>
      {/if}
    {/if}

    {#if cohort.yieldScale !== 1}
      <div class="line">
        <span class="label">harness</span>
        <span class="num">×{f(cohort.yieldScale, 2)}</span>
      </div>
    {/if}

    {#if heldBack > 0}
      <div class="line">
        <span class="label">held back</span>
        <span class="num">{f(heldBack)}</span>
      </div>
    {/if}
  {/if}

  <hr class="rule" />

  <div class="paid">
    {#each now as rate (rate.type)}
      <RateFigure
        type={rate.type}
        value={rate.value}
        delta={(after.find((r) => r.type === rate.type)?.value ?? rate.value) - rate.value}
      />
    {/each}
  </div>

  <div class="buy">
    <span>×{f(quantity)} for {formatCost(cost)}</span>
    <Badge kind={badgeFor(cohort.data.cost_type!)} />
  </div>
</div>

<style>
  .cohort-tip {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    min-width: 220px;
  }

  .title {
    font-weight: 600;
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .description {
    font-size: var(--fs-sm);
    line-height: 1.4;
    color: var(--ink-600);
    margin-bottom: var(--sp-1);
  }

  .rule {
    border: none;
    border-top: 1px solid var(--line-200);
    margin: var(--sp-1) 0;
    width: 100%;
  }

  .line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    font-size: var(--fs-sm);
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: var(--badge-gap);
    color: var(--ink-500);
    white-space: nowrap;
  }

  .num {
    font-stretch: var(--wd-figure);
    color: var(--ink-900);
    text-align: right;
    white-space: nowrap;
  }

  .dim {
    color: var(--ink-300);
    font-weight: 500;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }

  .paid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-3);
  }

  .buy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    margin-top: var(--sp-1);
  }
</style>
