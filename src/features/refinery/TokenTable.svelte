<script lang="ts">
  /**
   * The grades, and where they are bought. Matching happens here — the refinery
   * below only moves karma across, keeping its side.
   *
   * The inversion has no row of its own: it is the button on a red row, priced
   * in the opposite red. Beside it, greyed, the passive route — what the
   * refinery clears each batch without being asked.
   */
  import { Label, Section } from '$ui';
  import { ResourceManager } from '$lib/managers';
  import { refinery } from '$lib/refinery.svelte';
  import { tokens } from '$lib/tokens.svelte';
  import { pulse } from '$lib/loop';
  import TokenRow from './TokenRow.svelte';

  const COLUMNS = 'minmax(0, 1fr) 72px 88px 190px';

  /** The refinery draws the same batch from each pile, so both rows read alike. */
  const perBatch = $derived(refinery.batch || undefined);

  const inversionCost = $derived(tokens.inversionCost(1));

  const inversionNote = $derived(
    `Bought with the opposite Crimson, and dearer every time — ${tokens.inversions} so far.`,
  );

  function buy(action: () => unknown) {
    if (!action()) return;

    pulse();
  }
</script>

<Section label="Refining" title="Grades">
  <div class="table" style:--token-cols={COLUMNS}>

    <div class="head">
      <span><Label text="Grade" size="sm" /></span>
      <span class="right"><Label text="Held" size="sm" /></span>
      <span class="right"><Label text="Per batch" size="sm" /></span>
      <span class="right"><Label text="Cost" size="sm" /></span>
    </div>

    <TokenRow
      grade="red_negative"
      held={ResourceManager.getAmount('red_negative')}
      {perBatch}
      passive={perBatch ? { amount: perBatch, kind: 'neg' } : undefined}
      cost={inversionCost}
      costKind="red-pos"
      affordable={tokens.canInvert(-1)}
      note={inversionNote}
      onbuy={() => buy(() => tokens.invert(-1))}
    />

    <TokenRow
      grade="red_positive"
      held={ResourceManager.getAmount('red_positive')}
      {perBatch}
      passive={perBatch ? { amount: perBatch, kind: 'pos' } : undefined}
      cost={inversionCost}
      costKind="red-neg"
      affordable={tokens.canInvert(1)}
      note={inversionNote}
      onbuy={() => buy(() => tokens.invert(1))}
    />

    <TokenRow
      grade="yellow"
      held={ResourceManager.getAmount('yellow')}
      cost={tokens.yellowPrice}
      costKind="red-both"
      affordable={tokens.canBuyYellow}
      note="Taken from both Crimson piles at once — the figure is what each side loses."
      onbuy={() => buy(() => tokens.buyYellow())}
    />

    <TokenRow
      grade="blue"
      held={ResourceManager.getAmount('blue')}
      cost={tokens.isBlueUnlocked ? tokens.bluePrice : undefined}
      costKind="yellow"
      affordable={tokens.canBuyBlue}
      note={tokens.isBlueUnlocked ? undefined : 'Opens with the first Ochre.'}
      onbuy={() => buy(() => tokens.buyBlue())}
    />
  </div>
</Section>

<style>
  .table {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .head {
    display: grid;
    grid-template-columns: var(--token-cols);
    column-gap: var(--sp-3);
    align-items: end;
    padding-bottom: var(--sp-1);
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .head > span {
    display: flex;
    line-height: 1;
  }

  .head .right {
    justify-content: flex-end;
  }
</style>
