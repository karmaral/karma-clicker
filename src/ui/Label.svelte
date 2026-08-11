<script lang="ts">
  import type { LabelSize } from './types';

  interface Props {
    text: string;
    size?: LabelSize;
    /** A qualifier sitting beside a label, never a label on its own. */
    muted?: boolean;
  }

  let { text, size = 'default', muted = false }: Props = $props();
</script>

<span class={['label', size, { muted }]}>{text}</span>

<style>
  .label {
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--ink-400);
    line-height: 1;
  }

  .label.sm {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
    font-weight: 700;
    color: var(--ink-300);
  }

  .label.muted {
    color: var(--ink-300);
  }
</style>
