<script lang="ts">
  import { BuildingManager } from '$lib/managers';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  let bar = $state<HTMLSpanElement>();

  $effect(() => {
    const sweep = (detail?: Record<string, unknown>) => {
      const duration = Number(detail?.duration ?? 0);
      if (!duration || !bar) return;

      bar.getAnimations().forEach((animation) => animation.cancel());
      bar.animate([{ width: '0%' }, { width: '100%' }], { duration, easing: 'linear' });
    };

    BuildingManager.addListener(id, 'queue', sweep);
    return () => BuildingManager.removeListener(id, 'queue', sweep);
  });
</script>

<div class="cycle">
  <span class="progress" bind:this={bar}></span>
</div>

<style>
  .cycle {
    display: inline-flex;
    width: 100%;
    height: 2px;
    background: #dedede;
  }
  .progress {
    background: var(--ink-200);
  }
</style>
