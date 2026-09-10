<script lang="ts">
  /**
   * The dial is drafted here and paid for in the aside. The slider used to
   * commit on touch, which meant a drag across the track stamped the penalty
   * once per detent it crossed; now the control only points, and one verb buys.
   */
  import { Section } from '$ui';
  import { aim, type Detent } from '$lib/aim';
  import balance from '$data/balance';
  import { formatRounded } from '$lib/utils';
  import AimControl from './AimControl.svelte';

  const owed = $derived(aim.phasesOwed);
  const draft = $derived(aim.draft);

  /** What the verb will cost, not what is currently owed — nothing is owed yet. */
  const price = $derived(Math.round(balance.aim.reaimPenalty * 100));

  const note = $derived(
    owed > 0
      ? `Settling in — ${formatRounded(owed, 1)} phases left, karma down ${Math.round(aim.reaimPenalty * 100)}%`
      : 'Dense phases pay for negative, light for positive',
  );
</script>

<Section label="Aim" reading={aim.detentLabel(aim.detent)}>
  {#snippet aside()}
    <!-- The decision takes the aside while there is one; the standing note is
         what the panel says when nothing is pending. -->
    {#if draft !== undefined}
      <!-- Cancel first, so the verb that costs something takes the aside's own
           right edge — where the reading's eye already ends. -->
      <span class="pending">
        <button type="button" class="verb quiet" onclick={() => aim.cancel()}>Cancel</button>
        <button type="button" class="verb commit" onclick={() => aim.confirm()}>
          Aim {aim.detentLabel(draft).toLowerCase()} · −{price}%
        </button>
      </span>
    {:else}
      {note}
    {/if}
  {/snippet}

  <AimControl value={aim.detent} {draft} onaim={(value) => aim.aimAt(value as Detent)} />
</Section>

<style>
  .pending {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
  }

  .verb {
    padding: 0;
    background: none;
    border: none;
    font-size: var(--fs-sm);
    line-height: 1;
    white-space: nowrap;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  }

  /* Boxed, which is what puts it a rung above the caption rail it sits on: the
     aside is where a note usually goes, and an underlined word there reads as
     one more piece of that sentence rather than as the thing that spends. Same
     outline register and hover as `Button`'s, at the aside's own size. */
  .verb.commit {
    /* The padding is pulled back out of the line box: the head aligns on
       baselines, so a box that grew its own line would step the section's rule
       down every time a draft appeared. */
    margin-block: -5px;
    padding: 5px var(--sp-2);
    border: 1px solid var(--ink-900);
    background: var(--surface);
    color: var(--ink-900);
    font-weight: 600;
  }

  .verb.commit:hover {
    background: var(--res-xp);
    border-color: var(--res-xp);
    color: var(--ink-inverse);
  }

  /* Backing out is not a decision, so it stays text. */
  .verb.quiet {
    color: var(--ink-300);
  }

  .verb.quiet:hover {
    color: var(--ink-900);
  }
</style>
