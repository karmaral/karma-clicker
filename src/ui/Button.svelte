<script lang="ts">
  import type { ButtonLayout, ButtonVariant } from './types';

  interface Props {
    label: string;
    sub?: string;
    variant?: ButtonVariant;
    layout?: ButtonLayout;
    progress?: number;
    disabled?: boolean;
    onclick?: () => void;
  }

  let {
    label,
    sub,
    variant = 'filled',
    layout = 'stacked',
    progress,
    disabled = false,
    onclick,
  }: Props = $props();
</script>

<button
  type="button"
  class={['btn', variant, layout]}
  {disabled}
  {onclick}
>
  {#if progress !== undefined}
    <span class="progress" style:width="{Math.max(0, Math.min(100, progress))}%"></span>
  {/if}
  <span class="label">{label}</span>
  {#if sub}
    <span class="sub num">{sub}</span>
  {/if}
</button>

<style>
  .btn {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    width: 100%;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid transparent;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  }

  .progress {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--res-xp);
    transition: width var(--t-fast) linear;
  }

  .label,
  .sub {
    position: relative;
  }

  .label {
    font-size: var(--fs-md);
    font-weight: 600;
    line-height: 1.2;
  }

  .sub {
    font-size: var(--fs-sm);
    line-height: 1.2;
  }

  /* One rail, and the sub is a reading rather than a caption — so it wears the
     label's case and sits at the far end of the width instead of centring. */
  .btn.spread {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
  }

  .btn.spread .label {
    font-size: var(--fs-md);
  }

  .btn.spread .sub {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
    font-weight: 700;
    text-transform: uppercase;
  }

  .btn.filled {
    background: var(--ink-900);
    color: var(--ink-inverse);
  }

  .btn.filled .sub {
    color: hsl(0 0% 100% / .92);
  }

  .btn.filled:disabled {
    background: var(--ink-200);
  }

  .btn.outline {
    background: var(--surface);
    color: var(--ink-900);
    border-color: var(--ink-900);
  }

  .btn.outline .sub {
    color: var(--ink-500);
  }

  .btn.outline:disabled {
    color: var(--ink-300);
    border-color: var(--line-200);
  }

  .btn.outline:disabled .sub {
    color: var(--ink-300);
  }

  .btn.filled:hover:not(:disabled),
  .btn.filled:active:not(:disabled),
  .btn.outline:hover:not(:disabled),
  .btn.outline:active:not(:disabled) {
    background: var(--res-xp);
    color: var(--ink-inverse);
    border-color: var(--res-xp);
  }

  .btn.filled:hover:not(:disabled) .sub,
  .btn.filled:active:not(:disabled) .sub,
  .btn.outline:hover:not(:disabled) .sub,
  .btn.outline:active:not(:disabled) .sub {
    color: hsl(0 0% 100% / .92);
  }
</style>
