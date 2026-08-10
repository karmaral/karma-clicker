<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import { NotificationManager } from '$lib/managers';

  interface Props {
    toastId: string | number;
    title: string;
    description?: string;
  }
  let {
    toastId,
    title = 'Default',
    description = 'Description',
  }: Props = $props();

</script>

<div class="toast-content">
  <span class="title">{title}</span> 
  <span class="description">{description}</span> 
</div>

<style>
  .toast-content {
    display: flex;
    flex-direction: column;
  }
  .title {
    font-size: 1em;
    font-weight: bold;
  }
  .description {
    font-size: .9em;
  }

</style>
