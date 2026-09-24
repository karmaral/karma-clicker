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
  import { refinery } from '$lib/refinery.svelte';
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

<!-- The excess, in its own pile's hatch washed back. Each balancer move flashes
     it toward the pile it is being moved to. -->
{#snippet tail()}
  <span class={['span tail', isComfort ? 'comfort' : 'burden']} style:width={share(leftover)}>
    {#key refinery.moved}
      {#if refinery.moved > 0}<span class="flash"></span>{/if}
    {/key}
  </span>
{/snippet}

<Section label="Intake">

  <div class="bar">
    {#if leftover > 0 && !isComfort}{@render tail()}{/if}

    <!-- Keyed on lifetime refined, which only a pulse moves: each draw off the
         matched span flashes it the crimson it became. -->
    {#each ['neg', 'pos'] as side (side)}
      <span class="span {side}" style:width={share(matched)}>
        {#key refinery.refined}
          {#if refinery.refined > 0}<span class="flash"></span>{/if}
        {/key}
      </span>
    {/each}

    {#if leftover > 0 && isComfort}{@render tail()}{/if}
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
    background: var(--hatch-neg-bar);
    justify-content: flex-end;
    border-right: var(--rule-strong);
  }

  .span.pos {
    background: var(--hatch-pos-bar);
    box-shadow: var(--hatch-pos-edge);
  }

  /* The same stripe turned crimson, each half as the pile it pays. */
  .flash {
    position: absolute;
    inset: 0;
    opacity: 0;
    animation: flash 600ms ease-out;
    pointer-events: none;
  }

  .span.neg .flash { background: var(--hatch-red-neg-bar); }
  .span.pos .flash { background: var(--hatch-red-pos-bar); }

  @keyframes flash {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* The unpaired remainder: its pile's hatch, washed back so it reads as held
     but out of reach. */
  .span.tail {
    background: var(--line-100);
    box-shadow: var(--hatch-pos-edge);
  }

  .span.tail::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: .35;
  }

  .span.tail.burden::before { background: var(--hatch-neg-bar); }
  .span.tail.comfort::before { background: var(--hatch-pos-bar); }

  /* Toward the pile the balancer is filling. */
  .span.tail.burden .flash { background: var(--hatch-pos-bar); }
  .span.tail.comfort .flash { background: var(--hatch-neg-bar); }

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
