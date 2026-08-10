<script lang="ts">
  import { Section } from '$ui';
  import { aim, type Detent } from '$lib/aim';
  import { formatRounded } from '$lib/utils';
  import AimControl from './AimControl.svelte';

  const owed = $derived(aim.phasesOwed);

  const note = $derived(
    owed > 0
      ? `Settling in — ${formatRounded(owed, 1)} phases of it left`
      : 'Dense phases pay for negative, light for positive',
  );

  const status = $derived(
    owed > 0 ? `karma down ${Math.round(aim.reaimPenalty * 100)}%` : '',
  );
</script>

<Section label="Aim">
  {#snippet aside()}
    {status}
  {/snippet}

  <AimControl
    value={aim.detent}
    lean={aim.detentLabel(aim.detent)}
    {note}
    height="22px"
    onaim={(value) => aim.set(value as Detent)}
  />
</Section>
