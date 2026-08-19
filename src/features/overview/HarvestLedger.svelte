<script lang="ts">
  /**
   * The beat-8 promise, and nothing else. `overview.harvest` reveals two beats
   * before `overview.behind`, so this stands in the detail column until there is
   * a Behind band — which is where the rates and the total actually live.
   */
  import { Section } from '$ui';
</script>

<Section label="Harvest">
  <p class="empty">Nothing is behind you yet.</p>
</Section>

<style>
  .empty {
    margin: 0;
    padding: var(--sp-3) var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
