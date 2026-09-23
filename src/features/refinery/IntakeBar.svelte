<script lang="ts">
  /**
   * What is paired and what is not — and now literally what the refinery can and
   * cannot eat, since it draws both lanes together and the shorter pile caps it.
   * The matched span is its next meal; the tail is the excess, drawn where it
   * falls, and nothing downstream will ever reach it.
   */
  import { Badge, Label, Section } from '$ui';
  import { ResourceManager } from '$lib/managers';
  import { getUnpairedKarma } from '$lib/excess';
  import { f } from '$lib/utils';

  const negative = $derived(ResourceManager.getAmount('karma_negative'));
  const positive = $derived(ResourceManager.getAmount('karma_positive'));

  /** Signed, and `excess.ts` owns which way. Comfort is positive. */
  const unpaired = $derived(getUnpairedKarma());

  const matched = $derived(Math.min(negative, positive));
  const leftover = $derived(Math.abs(unpaired));
  const total = $derived(matched * 2 + leftover);

  const isComfort = $derived(unpaired > 0);

  const share = (amount: number) => (total > 0 ? `${(amount / total) * 100}%` : '0%');
</script>

<Section label="Intake">

  <div class="bar">
    {#if leftover > 0 && !isComfort}
      <span class="span tail" style:width={share(leftover)}></span>
    {/if}

    <span class="span neg" style:width={share(matched)}></span>
    <span class="span pos" style:width={share(matched)}></span>

    {#if leftover > 0 && isComfort}
      <span class="span tail" style:width={share(leftover)}></span>
    {/if}
  </div>

  <div class="poles">
    <span class={['pole', { held: leftover > 0 && !isComfort }]}>
      {#if leftover > 0 && !isComfort}
        <span class="mark"><Badge kind="neg" />{f(leftover)}</span>
      {:else}
        <span class="mark"><Badge kind="neg" />—</span>
      {/if}
      <Label text="Burden" size="sm" />
    </span>
    <!-- One figure for both spans: they are equal by construction. -->
    <span class={['pole centre', { held: matched > 0 }]}>
      <span class="mark"><Badge kind="both" />{f(matched)}</span>
      <Label text="Matched" size="sm" />
    </span>
    <span class={['pole right', { held: leftover > 0 && isComfort }]}>
      {#if leftover > 0 && isComfort}
        <span class="mark"><Badge kind="pos" />{f(leftover)}</span>
      {:else}
        <span class="mark"><Badge kind="pos" />—</span>
      {/if}
      <Label text="Comfort" size="sm" />
    </span>
  </div>
</Section>

<style>
  .bar {
    display: flex;
    height: 32px;
    background: var(--line-100);
    min-width: 0;
  }

  .span {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .span.neg {
    background: var(--hatch-neg);
    justify-content: flex-end;
    border-right: var(--rule-strong);
  }

  .span.pos {
    background: var(--hatch-pos);
    box-shadow: var(--hatch-pos-edge);
  }

  /* The unpaired remainder. Same ground as the track — it is what is left over. */
  .span.tail {
    background: var(--line-100);
    box-shadow: var(--hatch-pos-edge);
  }

  /* Grid, not space-between, so the centre pole sits dead centre whatever the
     side figures' widths. */
  .poles {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: var(--sp-4);
    min-width: 0;
  }

  .pole {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    color: var(--ink-300);
  }

  .pole.centre { align-items: center; }

  .pole.right {
    align-items: flex-end;
    text-align: right;
  }

  .pole.held { color: var(--ink-900); }

  .mark {
    font-size: var(--fs-md);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
  }
</style>
