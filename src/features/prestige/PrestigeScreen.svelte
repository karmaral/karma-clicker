<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ArrowRight } from '@steeze-ui/tabler-icons';
  import { Badge, Button, EscapeButton, Figure, Label, Meter, Value } from '$ui';
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

  /** Lifetime, not the pile — spending a cohort's price cannot cost the run its residue. */
  const xp = $derived(ResourceManager.getTotal('experience'));

  const before = $derived(prestige.yieldMultiplier);
  const after = $derived(1 + total * balance.prestige.yieldPerWisdom);

  /** Half-strength mirror of `before`/`after` — see `Click.yieldScale`. */
  const clickBefore = $derived(1 + (before - 1) * 0.5);
  const clickAfter = $derived(1 + (after - 1) * 0.5);

  const lost = $derived([
    { label: 'Souls', value: f(BuildingManager.countSouls()) },
    { label: 'Worlds finished', value: f(PlanetManager.finished) },
    { label: 'Cohorts unlocked', value: f(BuildingManager.cohorts.length) },
    { label: 'Refinery level', value: f(refinery.level) },
    { label: 'Upgrades held', value: f(UpgradeManager.acquiredLog.length) },
    // Held knowledge is lost; only what it bought on the kept shelf crosses.
    ...(ResourceManager.getTotal('knowledge') > 0
      ? [{ label: 'Knowledge held', value: f(ResourceManager.getAmount('knowledge')) }]
      : []),
  ]);

  function end() {
    if (!prestige.end(progression.beat, UpgradeManager.keptKeys())) refused = true;
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
    <EscapeButton onclose={() => onclose?.()} />

    <div class="score">
      <div class="gain">
        <Value kind="wisdom" value="+{f(prestige.gained)}" size="hero" />
        <span class="unit">wisdom</span>
      </div>
      <div class="formula">
        <span class="term">
          for producing <Value kind="red" value={f(refinery.produced)} size="lg" /> crimson
        </span>
        <span class="term">
          and earning <Value kind="xp" value={f(xp)} size="lg" /> experience
        </span>
      </div>

      <div class="climb">
        <Meter value={prestige.progress} height="6px" />
        <div class="band">
          <span class="need">
            {f(prestige.toNext)} crimson to <span class="end">{f(prestige.gained + 1)} wisdom</span>
          </span>
        </div>
      </div>
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
            The first wisdom lands at {f(balance.prestige.firstWisdomAt)} crimson produced, or
            {f(balance.prestige.firstWisdomFromXp)} experience earned, or any mix of the two. Below
            that the run leaves nothing.
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
    <div class="panel survives">
      <Label text="What survives" />

      <!-- Name, figure, then anything that qualifies it — OutputPanel's read. -->
      <div class="block">
        <Label text="Wisdom" size="caption" />
        <Value kind="wisdom" value={f(total)} size="lg" />
        <span class="sum">{f(prestige.held)} held + {f(prestige.gained)} earned</span>
      </div>

      <div class="block">
        <Label text="Cohort yield" size="caption" />
        <div class="swing">
          <Figure value="×{f(before)}" size="base" muted />
          <span class="arrow"><Icon src={ArrowRight} size="14px" /></span>
          <Figure value="×{f(after)}" size="md" />
        </div>
        <span class="sum">{Math.round(balance.prestige.yieldPerWisdom * 100)}% a unit, forever</span>
      </div>

      <div class="block">
        <Label text="Direct yield" size="caption" />
        <div class="swing">
          <Figure value="×{f(clickBefore)}" size="base" muted />
          <span class="arrow"><Icon src={ArrowRight} size="14px" /></span>
          <Figure value="×{f(clickAfter)}" size="md" />
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
    height: 100%;
    min-height: 615px;
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

  /* Grouping by space alone, as OutputPanel does: blocks sit several times
     further apart than a header from its own figures. */
  .survives {
    gap: var(--sp-5);
  }

  /* The title heads the panel rather than standing as a block of its own. */
  .survives > :global(.label) {
    margin-bottom: calc(var(--sp-3) - var(--sp-5));
  }

  .block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
    min-width: 0;
  }

  .block > :global(.label.caption) {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label-sm);
  }

  /* The multipliers one size under the wisdom that buys them; the before is
     kept only to say which way it moved. */
  .swing {
    display: flex;
    align-items: last baseline;
    gap: var(--sp-2);
    min-width: 0;
  }

  /* Out of the baseline group: an icon has no baseline of its own. */
  .arrow {
    display: flex;
    align-self: center;
    color: var(--ink-300);
  }

  .sum {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .middle {
    position: relative;
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
    --badge-size: var(--badge-size-lg);
    --badge-gap: var(--badge-gap-lg);
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

  /* Two lines rather than one run-on: the axes are summed, not sequential, and
     stacking them keeps either one readable when the other is still at zero. */
  .formula {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-1);
    font-size: var(--fs-base);
    font-variant-numeric: tabular-nums;
    color: var(--ink-500);
  }

  .term {
    display: flex;
    align-items: baseline;
    gap: var(--sp-2);
  }

  /* One band of the root, drawn flat. Each band is wider than the last, so the
     bar fills more slowly every time without the track ever lying about where
     the fill sits. Width tracks .verb so the climb reads as the button's cost. */
  .climb {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    width: min(100%, 545px);
    margin-top: var(--sp-3);
  }

  .band {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--sp-3);
    font-size: var(--fs-sm);
    font-variant-numeric: tabular-nums;
  }

  .end {
    color: var(--ink-700);
    font-weight: 600;
  }

  .need {
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
