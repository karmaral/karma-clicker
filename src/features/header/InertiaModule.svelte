<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Cell, Label, Meter } from '$ui';

  interface Pole {
    value: number;
    label: string;
  }

  interface Props {
    comfort: Pole;
    burden: Pole;
    fading?: string;
    consequence?: Snippet;
    banded?: boolean;
  }

  let { comfort, burden, fading, consequence, banded = false }: Props = $props();
</script>

<Cell label="Inertia" {banded}>
  {#snippet header()}
    {#if fading}
      <span class="fading">{fading}</span>
    {/if}
  {/snippet}

  <div class="inertia">
    <div class="poles">
      <span class="pole"><Label text="Comfort" size="sm"/></span>
      <Meter value={comfort.value} fill="pos" />
      <span class="pct num">{comfort.label}</span>

      <span class="ruler" aria-hidden="true"></span>

      <span class="pole"><Label text="Burden" size="sm" /></span>
      <Meter value={burden.value} fill="neg" />
      <span class="pct num">{burden.label}</span>
    </div>

    {#if consequence}
      <p class="consequence">{@render consequence()}</p>
    {/if}
  </div>
</Cell>

<style>
  .fading {
    display: flex;
    justify-content: flex-end;
    line-height: 1;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .inertia {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: 100%;
    min-width: 0;
  }

  .poles {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: var(--sp-3);
    row-gap: var(--sp-2);
    min-width: 0;
  }

  .pole {
    display: flex;
    line-height: 1;
  }

  .ruler {
    position: relative;
    grid-column: 1 / -1;
    height: 1px;
    background: var(--ink-900);
  }

  .pct {
    font-size: var(--fs-sm);
    font-weight: 400;
    text-align: right;
    line-height: 1;
  }

  .consequence {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }

  .consequence :global(b) {
    color: var(--ink-900);
    font-weight: 600;
  }
</style>
