<script lang="ts">
  import type { ButtonVariant } from './types';

  interface Props {
    label: string;
    sub?: string;
    variant?: ButtonVariant;
    progress?: number;
    disabled?: boolean;
    onclick?: () => void;
  }

  let {
    label,
    sub,
    variant = 'filled',
    progress,
    disabled = false,
    onclick,
  }: Props = $props();
</script>

<button
  type="button"
  class={['btn', variant]}
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
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  }

  .btn:disabled {
    cursor: default;
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
