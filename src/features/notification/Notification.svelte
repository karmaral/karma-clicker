<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import { NotificationManager } from '$lib/managers';

  export let toastId: string | number;
  export let title: string = 'Default'
  export let description: string = 'Description';

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
