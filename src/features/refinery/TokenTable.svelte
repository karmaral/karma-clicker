<script lang="ts">
  /**
   * The grades, and where they are bought. Matching happens here — the refinery
   * below only moves karma across, keeping its side.
   *
   * The inversion has no row of its own: it is the button on a red row, priced
   * in the opposite red. Beside it, greyed, the passive route — what the
   * refinery clears each batch without being asked.
   */
  import { Label, Section, Tabs } from '$ui';
  import { ResourceManager } from '$lib/managers';
  import { refinery } from '$lib/refinery.svelte';
  import { tokens } from '$lib/tokens.svelte';
  import { pulse } from '$lib/loop';
  import TokenRow from './TokenRow.svelte';
  import { resolvePurchasable, resolveQuantity, type TokenPurchaseMode } from './purchase';

  const COLUMNS = 'minmax(0, 1fr) 72px 88px 190px';

  const PURCHASE_MODES: readonly TokenPurchaseMode[] = ['1', '10', '100', 'Max'];

  let purchaseMode: TokenPurchaseMode = $state('1');

  function cyclePurchaseMode() {
    const at = PURCHASE_MODES.indexOf(purchaseMode);

    purchaseMode = PURCHASE_MODES[(at + 1) % PURCHASE_MODES.length];
  }

  /** The refinery draws the same batch from each pile, so both rows read alike. */
  const perBatch = $derived(refinery.batch || undefined);

  const invertNegRaw = $derived(resolveQuantity(purchaseMode, () => tokens.getMaxInvert(-1)));
  const invertNegQuantity = $derived(resolvePurchasable(purchaseMode, () => tokens.getMaxInvert(-1)));
  const invertNegAffordable = $derived(invertNegRaw > 0 && tokens.canInvert(-1, invertNegRaw));

  const invertPosRaw = $derived(resolveQuantity(purchaseMode, () => tokens.getMaxInvert(1)));
  const invertPosQuantity = $derived(resolvePurchasable(purchaseMode, () => tokens.getMaxInvert(1)));
  const invertPosAffordable = $derived(invertPosRaw > 0 && tokens.canInvert(1, invertPosRaw));

  const yellowRaw = $derived(resolveQuantity(purchaseMode, () => tokens.getMaxYellow()));
  const yellowQuantity = $derived(resolvePurchasable(purchaseMode, () => tokens.getMaxYellow()));
  const yellowAffordable = $derived(yellowRaw > 0 && tokens.canPurchaseYellow(yellowRaw));

  const blueRaw = $derived(resolveQuantity(purchaseMode, () => tokens.getMaxBlue()));
  const blueQuantity = $derived(resolvePurchasable(purchaseMode, () => tokens.getMaxBlue()));
  const blueAffordable = $derived(blueRaw > 0 && tokens.canPurchaseBlue(blueRaw));

  const wisdomRaw = $derived(resolveQuantity(purchaseMode, () => tokens.getMaxWisdom()));
  const wisdomQuantity = $derived(resolvePurchasable(purchaseMode, () => tokens.getMaxWisdom()));
  const wisdomAffordable = $derived(wisdomRaw > 0 && tokens.canPurchaseWisdom(wisdomRaw));

  const inversionNote = $derived(
    `Bought with the opposite Crimson, and dearer every time — ${tokens.inversions} so far.`,
  );

  function purchase(action: () => unknown) {
    if (!action()) return;

    pulse();
  }
</script>

<Section>
  <div class="table" style:--token-cols={COLUMNS}>

    <div class="head">
      <span><Label text="Grade" size="sm" /></span>
      <span class="right"><Label text="Held" size="sm" /></span>
      <span class="right"><Label text="Per batch" size="sm" /></span>

      <!-- The head cell is the switcher: the words are a read-out of where the
           cycle is, and clicking anywhere in the cell advances it. -->
      <button type="button" class="cost right" onclick={cyclePurchaseMode}>
        <Label text="Cost ×" size="sm" />
        <Tabs tabs={PURCHASE_MODES} active={purchaseMode} size="sm" interactive={false} />
      </button>
    </div>

    <TokenRow
      grade="red_negative"
      held={ResourceManager.getAmount('red_negative')}
      {perBatch}
      passive={perBatch ? { amount: perBatch, kind: 'neg' } : undefined}
      cost={tokens.inversionCost(invertNegQuantity)}
      costKind="red-pos"
      quantity={invertNegQuantity}
      affordable={invertNegAffordable}
      note={inversionNote}
      onpurchased={() => purchase(() => tokens.invert(-1, invertNegQuantity))}
      oncyclemode={cyclePurchaseMode}
    />

    <TokenRow
      grade="red_positive"
      held={ResourceManager.getAmount('red_positive')}
      {perBatch}
      passive={perBatch ? { amount: perBatch, kind: 'pos' } : undefined}
      cost={tokens.inversionCost(invertPosQuantity)}
      costKind="red-neg"
      quantity={invertPosQuantity}
      affordable={invertPosAffordable}
      note={inversionNote}
      onpurchased={() => purchase(() => tokens.invert(1, invertPosQuantity))}
      oncyclemode={cyclePurchaseMode}
    />

    <TokenRow
      grade="yellow"
      held={ResourceManager.getAmount('yellow')}
      cost={tokens.yellowPrice * yellowQuantity}
      costKind="red-both"
      quantity={yellowQuantity}
      affordable={yellowAffordable}
      note="Taken from both Crimson piles at once — the figure is what each side loses."
      onpurchased={() => purchase(() => tokens.purchaseYellow(yellowQuantity))}
      oncyclemode={cyclePurchaseMode}
    />

    <TokenRow
      grade="blue"
      held={ResourceManager.getAmount('blue')}
      cost={tokens.isBlueUnlocked ? tokens.bluePrice * blueQuantity : undefined}
      costKind="yellow"
      quantity={blueQuantity}
      affordable={blueAffordable}
      note={tokens.isBlueUnlocked ? undefined : 'Opens with the first Ochre.'}
      onpurchased={() => purchase(() => tokens.purchaseBlue(blueQuantity))}
      oncyclemode={cyclePurchaseMode}
    />

    <TokenRow
      grade="wisdom"
      held={ResourceManager.getAmount('wisdom')}
      cost={tokens.wisdomPrice * wisdomQuantity}
      costKind="wisdom"
      quantity={wisdomQuantity}
      affordable={wisdomAffordable}
      onpurchased={() => purchase(() => tokens.purchaseWisdom(wisdomQuantity))}
      oncyclemode={cyclePurchaseMode}
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

  .cost {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
    padding: var(--sp-1) var(--sp-2);
    margin: calc(var(--sp-1) * -1) calc(var(--sp-2) * -1);
    border: none;
    background: transparent;
    line-height: 1;
    white-space: nowrap;
  }
  .cost:hover {
    background-color: var(--surface-alt);
  }
  .cost:hover :global(.tab:not(.active)) {
    color: var(--ink-500);
  }
  .cost :global(.tabs) {
    gap: var(--sp-2);
  }
</style>
