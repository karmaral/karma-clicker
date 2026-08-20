<script lang="ts">
  /**
   * The lab, in the shape the widget workbench already uses: sliders over the
   * data, `revert` for all of them, `copy` for the blocks you moved.
   */
  import LabPanel from '$widgets/LabPanel.svelte';
  import type { BalanceParam } from '$lib/sim/params';
  import { balanceLab } from './balance-lab.svelte';

  interface Props {
    title: string;
    groups: string[];
    params: BalanceParam[];
  }

  let { title, groups, params }: Props = $props();

  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(balanceLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  {title}
  {groups}
  {params}
  value={(key) => balanceLab.value(key)}
  set={(key, value) => balanceLab.set(key, value)}
  reset={(key) => balanceLab.reset(key)}
  changed={(key) => balanceLab.isChanged(key)}
>
  {#snippet header()}
    <div class="row">
      <span class="id">{balanceLab.touched} moved</span>
      <button onclick={() => balanceLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>
  {/snippet}
</LabPanel>
