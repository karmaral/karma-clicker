<script lang="ts">
  import LabPanel from './LabPanel.svelte';
  import { PULSE_GROUPS, PULSE_PARAMS, type PulseVisual } from './planet';
  import { pulseLab } from './pulse-lab.svelte';

  let copied = $state(false);

  const current = $derived(pulseLab.current);

  async function copy() {
    await navigator.clipboard.writeText(pulseLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="pulse lab"
  groups={PULSE_GROUPS}
  params={PULSE_PARAMS}
  value={(key) => current[key as keyof PulseVisual]}
  set={(key, value) => pulseLab.set(key as keyof PulseVisual, value)}
  reset={(key) => pulseLab.reset(key as keyof PulseVisual)}
>
  {#snippet header()}
    <div class="row">
      <span class="id">click a world</span>
      <button onclick={() => pulseLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>
  {/snippet}
</LabPanel>
