<script lang="ts">
  /**
   * A bar swept once per emission. Knows nothing about what emits — the caller
   * hands it a subscribe closure and gets its own teardown back.
   */
  import type { Listener } from '$lib/emission';

  interface Props {
    subscribe: (fn: Listener) => () => void;
    width?: string;
    height?: string;
  }

  let { subscribe, width = '12rem', height = '3px' }: Props = $props();

  let bar = $state<HTMLSpanElement>();

  $effect(() => {
    const sweep = (detail?: Record<string, unknown>) => {
      const duration = Number(detail?.duration ?? 0);
      if (!duration || !bar) return;

      bar.getAnimations().forEach((animation) => animation.cancel());
      bar.animate([{ width: '0%' }, { width: '100%' }], { duration, easing: 'linear' });
    };

    return subscribe(sweep);
  });
</script>

<div class="sweep" style:width style:height>
  <span class="progress" bind:this={bar}></span>
</div>

<style>
  .sweep {
    display: inline-flex;
    background: var(--line-100);
  }
  .progress {
    background: var(--ink-400);
  }
</style>
