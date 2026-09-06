<script lang="ts">
  import { Badge, Button, Figure, Label, Value } from '$ui';
  import { BuildingManager, PlanetManager, ResourceManager, UpgradeManager } from '$lib/managers';
  import { GRADES, GRADE_LABELS } from '$lib/labels';
  import { badgeFor } from '$features/details/badge';
  import { prestige } from '$lib/prestige.svelte';
  import { progression } from '$lib/progression';
  import { refinery } from '$lib/refinery.svelte';
  import balance from '$data/balance';
  import { f } from '$lib/utils';

  interface Props {
    onclose?: () => void;
  }

  let { onclose }: Props = $props();

  /** Set only by a refused write — the run is untouched, and the rail says so. */
  let refused = $state(false);

  const total = $derived(prestige.held + prestige.gained);

  const before = $derived(prestige.yieldMultiplier);
  const after = $derived(1 + total * balance.prestige.yieldPerWisdom);

  /** Half-strength mirror of `before`/`after` — see `Click.yieldScale`. */
  const clickBefore = $derived(1 + (before - 1) * 0.5);
  const clickAfter = $derived(1 + (after - 1) * 0.5);

  /** What the run is short of, when it is short. */
  const missing = $derived(balance.prestige.firstWisdomAt - refinery.produced);

  const lost = $derived([
    { label: 'Souls', value: f(BuildingManager.countSouls()) },
    { label: 'Worlds finished', value: f(PlanetManager.finished) },
    { label: 'Cohorts unlocked', value: f(BuildingManager.cohorts.length) },
    { label: 'Refinery level', value: f(refinery.level) },
    { label: 'Upgrades held', value: f(UpgradeManager.acquiredLog.length) },
  ]);

  function end() {
    if (!prestige.end(progression.beat)) refused = true;
  }
</script>

<div class="prestige">
  <div class="shoulder">
    <div class="panel">
      <Label text="What goes" />

      <div class="ledger">
        {#each lost as row (row.label)}
          <div class="row">
            <span class="name">{row.label}</span>
            <span class="num">{row.value}</span>
          </div>
        {/each}
      </div>

      <div class="ledger">
        {#each GRADES as grade (grade)}
          <div class="row">
            <span class="name">
              <Badge kind={badgeFor(grade)} />{GRADE_LABELS[grade]}
            </span>
            <span class="num">{f(ResourceManager.getAmount(grade))}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="middle">
    <div class="score">
      <div class="gain">
        <Value kind="wisdom" value={f(prestige.gained)} size="hero" />
        <span class="unit">wisdom</span>
      </div>
      <span class="formula">
        for producing <Value kind="red" value={f(refinery.produced)} size="lg" /> crimson this run
      </span>
    </div>

    <div class="verb">
      <Button
        layout="spread"
        label="End the run"
        sub="+{f(prestige.gained)} wisdom"
        disabled={!prestige.isOpen}
        onclick={end}
      />

      <div class="warning">
        <span class="note">
          {#if refused}
            The legacy could not be stored, so the run stands. Free some browser storage.
          {:else if !prestige.isOpen}
            Needs {f(balance.prestige.firstWisdomAt)} crimson produced · {f(refinery.produced)} so far,
            {f(missing)} to go
          {:else}
            Everything but wisdom goes: every soul, every world, every upgrade, the refinery and
            its level. There is no way back into this run.
          {/if}
        </span>
        <button class="quit" onclick={() => onclose?.()}>Not yet</button>
      </div>
    </div>
  </div>

  <div class="shoulder right">
    <div class="panel">
      <Label text="What survives" />

      <div class="wisdom">
        <Value kind="wisdom" value={f(total)} size="xl" />
        <span class="sum">{f(prestige.held)} held + {f(prestige.gained)} earned</span>
      </div>

      <div class="multiplier">
        <Label text="Cohort yield" size="sm" />
        <div class="swing">
          <Figure value="×{f(before)}" size="lg" muted />
          <span class="arrow">→</span>
          <Figure value="×{f(after)}" size="xl" />
        </div>
        <span class="sum">{Math.round(balance.prestige.yieldPerWisdom * 100)}% a unit, forever</span>
      </div>

      <div class="multiplier">
        <Label text="Direct yield" size="sm" />
        <div class="swing">
          <Figure value="×{f(clickBefore)}" size="lg" muted />
          <span class="arrow">→</span>
          <Figure value="×{f(clickAfter)}" size="xl" />
        </div>
        <span class="sum">Half the cohort rate — the press rides wisdom, not a cohort</span>
      </div>
    </div>
  </div>
</div>

<style>
  .prestige {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 620px) minmax(0, 1fr);
    align-items: start;
    gap: var(--sp-5);
    padding: var(--sp-5) var(--sp-4);
    min-height: 680px;
  }

  .shoulder {
    min-width: 0;
    width: 100%;
    max-width: 380px;
  }

  .right {
    justify-self: end;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-4);
    background: var(--surface);
    border: var(--rule-card);
    min-width: 0;
  }

  .wisdom,
  .multiplier {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    --badge-size: 18px;
    --badge-gap: 12px;
    min-width: 0;
  }

  /* The one place the multiplier is ever a number, so it is the largest thing
     in the column — the before is kept beside it only to say which way it moved. */
  .swing {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    min-width: 0;
  }

  .arrow {
    font-size: var(--fs-base);
    color: var(--ink-300);
  }

  .sum {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .middle {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--sp-5);
    min-width: 0;
    height: 100%;
  }

  .score {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: auto;
    gap: var(--sp-2);
  }
  .gain :global(.value) {
    --badge-size: 18px;
    --badge-gap: 12px;
  }

  .gain {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
  }

  .unit {
    font-size: var(--fs-lg);
    color: var(--ink-500);
  }

  .formula {
    font-size: var(--fs-base);
    font-variant-numeric: tabular-nums;
    color: var(--ink-500);
  }

  .verb {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: min(100%, 545px);
    margin-inline: auto;

    & :global(.btn) {
      padding-block: var(--sp-4);
    }
  }

  .warning {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    padding: 0 var(--sp-2) var(--sp-3);
  }

  .note {
    flex: 1;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    font-weight: 500;
  }

  .quit {
    padding: 0;
    border: none;
    background: none;
    font-size: var(--fs-sm);
    color: var(--ink-900);
    font-weight: 500;
    text-decoration: underline;
  }

  .ledger {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: var(--sp-1) 0;
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    color: var(--ink-700);
    min-width: 0;
  }

  .num {
    font-size: var(--fs-base);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ink-900);
  }
</style>
