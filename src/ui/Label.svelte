<script lang="ts">
  import type { LabelSize, LabelTone } from './types';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    text: string;
    size?: LabelSize;
    /** A section's standing: the tab rule above it says the same thing in a rule. */
    tone?: LabelTone;
    /** A qualifier sitting beside a label, never a label on its own. */
    muted?: boolean;
    classValue?: ClassValue;
  }

  let { 
    text,
    size = 'default',
    tone = 'inactive',
    muted = false,
    classValue,
  }: Props = $props();
</script>

<span class={['label', size, tone, { muted }, classValue ]}>{text}</span>

<style>
  .label {
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--ink-300);
    line-height: 1;
    user-select: none;
  }

  .label.active { color: var(--ink-900); }
  .label.disabled  { color: var(--ink-200); }

  .label.sm {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
  }

  /* Lighter than the label it qualifies, so the two never read as a pair of headings. */
  .label.muted {
    font-weight: 600;
    color: var(--ink-300);
  }
</style>
