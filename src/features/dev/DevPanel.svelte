<script lang="ts">
  import { progression, beats } from '$lib/progression';
  import {
    BuildingManager, PlanetManager, ResourceManager, UpgradeManager,
  } from '$lib/managers';
  import { pulse } from '$lib/loop';
  import { getExcess } from '$lib/excess';
  import { reserve, type SplitJob } from '$lib/reserve.svelte';
  import { refinery } from '$lib/refinery.svelte';
  import { f, formatSpan } from '$lib/utils';
  import buildingData from '$data/buildings';
  import planetData from '$data/planets';

  /** Console handle, for poking at state by hand and for the headless driver. */
  Object.assign(window, {
    karma: { progression, ResourceManager, BuildingManager, PlanetManager, UpgradeManager },
  });

  let open = $state(true);

  const current = $derived(progression.current?.id ?? 'none');

  /** The two figures beat 10 turns on, so a stuck run is diagnosable on sight. */
  const excess = $derived(getExcess());
  const planet = $derived(PlanetManager.getActive());

  function jump(delta: number) {
    progression.jumpTo(progression.beat + delta);
  }

  function grant(type: 'experience' | 'karma_positive' | 'karma_negative', amount: number) {
    ResourceManager.add(type, amount);
    pulse();
  }

  /** The wave is a clock now, so nothing you can grant walks it. This does. */
  function skipPhases(count: number) {
    const active = PlanetManager.getActive();
    if (!active) return;

    active.advance(active.phaseDuration * count);
    pulse();
  }

  /** The only way to set either split until its screen is built. */
  function reserveSouls(job: SplitJob, fraction: number) {
    reserve.set(job, fraction);
    pulse();
  }

  function unlockCohorts() {
    for (const id of Object.keys(buildingData)) {
      if (buildingData[id].role === 'click') continue;

      BuildingManager.unlock(id);
    }
    pulse();
  }

  /** Fills the Ahead band without paying for discovery. Reaching still needs a harvest. */
  function unlockPlanets() {
    for (const id of Object.keys(planetData)) {
      PlanetManager.unlock(id);
    }
    pulse();
  }
</script>

<aside class={['dev', { open }]}>
  <button class="toggle" onclick={() => (open = !open)}>
    dev · beat {progression.beat}/{beats.length}
  </button>

  {#if open}
    <div class="body">
      <div class="row">
        <span class="id">{current}</span>
        <button onclick={() => jump(-1)}>−</button>
        <button onclick={() => jump(1)}>+</button>
        <button onclick={() => progression.jumpTo(0)}>reset</button>
      </div>

      <div class="row">
        <span class="id">xp {f(ResourceManager.getAmount('experience'))}</span>
        <button onclick={() => grant('experience', 1e3)}>+1k</button>
        <button onclick={() => grant('experience', 1e5)}>+100k</button>
        <button onclick={() => grant('experience', 1e6)}>+1M</button>
        <button onclick={() => grant('experience', 1e7)}>+10M</button>
        <button onclick={() => grant('experience', 1e8)}>+100M</button>
      </div>

      <div class="row">
        <span class="id">
          {#if planet}
            wave {formatSpan(planet.lived)} of {formatSpan(planet.length)}
            · {planet.agesLived} ages · phase {planet.phase + 1}/{planet.phasesPerAge}
          {:else}
            wave — no active world
          {/if}
        </span>
        <button onclick={() => skipPhases(1)}>+1 phase</button>
        <button onclick={() => skipPhases(planet?.phasesPerAge ?? 0)}>+1 age</button>
      </div>

      <div class="row">
        <span class="id">karma {f(ResourceManager.getAmount('karma_positive'))}</span>
        <button onclick={() => grant('karma_positive', 1e4)}>+10k pos</button>
        <button onclick={() => grant('karma_negative', 1e4)}>+10k neg</button>
      </div>

      <div class="row">
        <span class="id">
          excess {excess === undefined ? '—' : `${Math.round(excess * 100)}%`}
          · {planet?.unmetFirstHarvestConditions.join(', ') || 'harvestable'}
        </span>
      </div>

      <div class="row">
        <span class="id">
          anchoring {BuildingManager.countAnchoring()} of {BuildingManager.countSouls()}
        </span>
        <button onclick={() => reserveSouls('anchoring', 0)}>0</button>
        <button onclick={() => reserveSouls('anchoring', 0.25)}>25%</button>
        <button onclick={() => reserveSouls('anchoring', 0.5)}>50%</button>
      </div>

      <div class="row">
        <span class="id">
          refining {BuildingManager.countRefining()} of {BuildingManager.countSouls()}
        </span>
        <button onclick={() => reserveSouls('refining', 0)}>0</button>
        <button onclick={() => reserveSouls('refining', 0.25)}>25%</button>
        <button onclick={() => reserveSouls('refining', 0.5)}>50%</button>
      </div>

      <div class="row">
        <span class="id">
          slots {refinery.workers}/{refinery.slots}
          · lvl {refinery.level} ({f(refinery.exp)}/{f(refinery.expToNext)})
          · {f(refinery.perSecond)}/s each way
          · red {f(ResourceManager.getAmount('red_positive'))}
          /{f(ResourceManager.getAmount('red_negative'))}
        </span>
      </div>

      <div class="row">
        <span class="id">
          {PlanetManager.behind.length} behind
          · {PlanetManager.ahead.length} ahead
          · {PlanetManager.canReach ? 'can reach' : 'held'}
        </span>
        <button onclick={unlockPlanets}>unlock all planets</button>
      </div>

      <div class="row">
        <button onclick={unlockCohorts}>unlock all cohorts</button>
      </div>
    </div>
  {/if}
</aside>

<style>
  .dev {
    position: fixed;
    right: var(--sp-3);
    bottom: var(--sp-3);
    z-index: 40;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: var(--rule-card);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
  }

  .toggle {
    background: var(--ink-900);
    color: var(--surface);
    border: none;
    padding: var(--sp-2) var(--sp-3);
    font: inherit;
    text-align: left;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-3);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .id {
    flex: 1;
    color: var(--ink-400);
    white-space: nowrap;
  }

  .body button {
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
    font: inherit;
  }

  .body button:hover {
    background: var(--surface-alt);
  }
</style>
