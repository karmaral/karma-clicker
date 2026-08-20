<script lang="ts">
  import { Section } from '$ui';
  import { aim, type Detent } from '$lib/aim';
  import { formatRounded } from '$lib/utils';
  import AimControl from './AimControl.svelte';

  const owed = $derived(aim.phasesOwed);

  const note = $derived(
    owed > 0
      ? `Settling in — ${formatRounded(owed, 1)} phases left, karma down ${Math.round(aim.reaimPenalty * 100)}%`
      : 'Dense phases pay for negative, light for positive',
  );
</script>

<Section label="Aim" reading={aim.detentLabel(aim.detent)}>
  {#snippet aside()}
    {note}
  {/snippet}

  <AimControl value={aim.detent} onaim={(value) => aim.set(value as Detent)} />
</Section>
