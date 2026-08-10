<script lang="ts">
  import { Label } from '$ui';
  import { DOT_TYPES, DOT_TYPE_KEYS, type DotType } from './dot-types';
  import { currentDots, dotCapacity, setDotCount } from './dots.svelte';

  const total = $derived(DOT_TYPE_KEYS.reduce((sum, t) => sum + (currentDots[t] ?? 0), 0));

  function step(type: DotType, delta: number) {
    setDotCount(type, (currentDots[type] ?? 0) + delta);
  }
</script>

<div class="dot-preview">
  <Label text="Dots" size="sm" />
  <ul>
    {#each DOT_TYPE_KEYS as type}
      <li>
        <span
          class="swatch"
          aria-hidden="true"
          style:--dot-size={`${DOT_TYPES[type].scaleFactor * 18}px`}
        ></span>
        <span class="name">{DOT_TYPES[type].label}</span>
        <span class="stepper">
          <button onclick={() => step(type, -1)} aria-label="fewer">−</button>
          <input
            type="number"
            min={0}
            max={dotCapacity}
            value={currentDots[type]}
            onchange={(e) => setDotCount(type, Number(e.currentTarget.value))}
          />
          <button onclick={() => step(type, 1)} aria-label="more">+</button>
        </span>
      </li>
    {/each}
  </ul>
  <span class="total">{total}/{dotCapacity}</span>
</div>

<style>
  .dot-preview {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    background: var(--canvas);
    border: var(--rule-strong);
    padding: var(--sp-3);
    min-width: 11rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--ink-400);
  }

  .swatch {
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;
    background: var(--ink-900);
    flex: none;
  }

  .name {
    flex: 1;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
  }

  .stepper button {
    width: 1.25rem;
    height: 1.25rem;
    display: grid;
    place-items: center;
    border: var(--rule-card);
    border-radius: 4px;
    background: transparent;
    color: var(--ink-700);
    font-size: var(--fs-base);
    line-height: 1;
    cursor: pointer;
  }

  .stepper input {
    width: 2.5rem;
    text-align: center;
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--ink-300);
    border: var(--rule-card);
    border-radius: 4px;
    background: transparent;
    padding: 2px 0;
  }

  .total {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--ink-300);
  }
</style>
