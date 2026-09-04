/**
 * One run of the real economy under a virtual clock. Everything a player does
 * apart from the buy decision is a rule here, so the policies stay comparable.
 *
 * Imported dynamically by the worker: the managers must not be evaluated until
 * the data overrides have landed.
 */

import { tick } from 'svelte';
import { setClock } from '$lib/clock';
import { BuildingManager, PlanetManager, ResourceManager, UpgradeManager } from '$lib/managers';
import { beats, progression } from '$lib/progression';
import { pulse } from '$lib/loop';
import { refinery } from '$lib/refinery.svelte';
import { harness } from '$lib/harness.svelte';
import { reserve } from '$lib/reserve.svelte';
import { aim } from '$lib/aim';
import { getExcess } from '$lib/excess';
import buildingData from '$data/buildings';
import upgradeData from '$data/upgrades';
import type { ResourceType } from '$types';
import VirtualClock from './virtual-clock';
import { buildLadder, marginalPerSecond, paybackOf } from './ladder';
import { POLICIES, stanceLabel } from './policy';
import type {
  ArrivalRecord, BeatRecord, Candidate, HarvestRecord, Sample, SimConfig, SimProgress, SimResult,
} from './types';

/** Matches the live loop, so beat triggers are polled at the cadence they will be. */
const TICK_MS = 250;

const PROGRESS_EVERY = 400;

const RESOURCE_TYPES: ResourceType[] = [
  'experience', 'karma_positive', 'karma_negative', 'red_positive', 'red_negative', 'yellow', 'blue',
];

export const DEFAULT_CONFIG: SimConfig = {
  policy: 'cheapest',
  merge: 'floor',
  hours: 6,
  clicksPerSecond: 4,
  reserveFraction: 0.25,
  anchorFraction: 0.25,
  detent: 0,
  sampleSeconds: 30,
  generousMargin: 0.15,
  maxBuysPerTick: 25,
  tailSeconds: 300,
  overrides: {},
};

/** Two turns, because an upgrade's effect list awaits a tick between entries. */
async function settle() {
  await tick();
  await tick();
}

export async function run(
  input: Partial<SimConfig> = {},
  onProgress?: (progress: SimProgress) => void,
): Promise<SimResult> {
  const config: SimConfig = { ...DEFAULT_CONFIG, ...input };
  const clock = new VirtualClock();
  setClock(clock);

  // Before anything is bought, so the ladder reads the data and not the run.
  const ladder = buildLadder();

  const policy = POLICIES[config.policy];
  const beatRecords: BeatRecord[] = [];
  const samples: Sample[] = [];
  const harvests: HarvestRecord[] = [];
  const arrivals = new Map<string, ArrivalRecord>();

  let recordedBeats = 0;
  let lastBeatAt = 0;
  let clickDebt = 0;
  let nextSampleAt = 0;
  let allBeatsAt: number | undefined;
  let aimSet = false;
  let reserveSet = false;
  let ticks = 0;

  const clicksPerTick = config.clicksPerSecond * (TICK_MS / 1000);
  const limitMs = config.hours * 3_600_000;

  // The world you start standing on, as App.svelte seeds it.
  PlanetManager.unlock('first');
  PlanetManager.select('first');
  BuildingManager.unlock('main');

  // What `watchHarness` does in the live game: the press pays into anchoring on
  // the payout landing, not on the queue, so a run clicks a world open the same
  // way a player does.
  BuildingManager.addListener('main', 'action', () => harness.placeByHand());

  function click() {
    BuildingManager.getBuilding('main')?.queueAction();
  }

  /**
   * A cohort starts manual now (§5, *Clerks*) — without this every run stalls
   * the moment its clerk is out of reach. Same convention as `buyUpgrades`: a
   * perfectly attentive player sends every idle row every tick.
   */
  function workManualCohorts() {
    for (const id of BuildingManager.cohorts) {
      const building = BuildingManager.getBuilding(id);
      if (!building || building.count === 0) continue;
      if (building.isAutonomous || building.isInProgress) continue;

      building.queueAction();
    }
  }

  /**
   * Wall-clock to a cohort's own two moments — revealed, then first copy. Read
   * off `BuildingManager.cohorts` rather than the beat ladder, so the retune
   * session opens with a figure per cohort instead of one per beat.
   */
  function recordArrivals() {
    for (const id of BuildingManager.cohorts) {
      const building = BuildingManager.getBuilding(id);
      if (!building) continue;

      let record = arrivals.get(id);
      if (!record) {
        const index = Number(id.match(/^cohort_(\d+)$/)?.[1]) || arrivals.size + 1;

        record = {
          cohort: id, index, revealedAtMs: clock.now(),
          firstCopyAtMs: undefined, experienceAtFirstCopy: undefined,
        };
        arrivals.set(id, record);
      }

      if (record.firstCopyAtMs === undefined && building.total > 0) {
        record.firstCopyAtMs = clock.now();
        record.experienceAtFirstCopy = ResourceManager.getTotal('experience');
      }
    }
  }

  /** Every priced upgrade the moment it is affordable — how most players play. */
  function buyUpgrades() {
    for (const target of Object.keys(upgradeData)) {
      for (const item of upgradeData[target]) {
        if (!item.costs) continue;
        if (UpgradeManager.isAcquired(target, item.id)) continue;
        if (UpgradeManager.isLocked(target, item.id)) continue;

        UpgradeManager.purchase(target, item.id);
      }
    }
  }

  function affordable(): Candidate[] {
    const list: Candidate[] = [];

    for (const id of BuildingManager.buildings) {
      const { role, cost_type: costType } = buildingData[id];
      if (role === 'click' || !costType) continue;

      const building = BuildingManager.getBuilding(id);
      const cost = building?.getCost(1);
      if (!building || !cost || !ResourceManager.has(costType, cost)) continue;

      const marginal = marginalPerSecond(building, costType);

      list.push({
        id,
        cost,
        costType,
        marginalPerSecond: marginal,
        paybackSeconds: paybackOf(cost, marginal),
      });
    }

    return list;
  }

  function buyCohorts() {
    for (let bought = 0; bought < config.maxBuysPerTick; bought++) {
      const chosen = policy.next(affordable());
      if (!chosen) return;

      BuildingManager.purchase(chosen.id, 1);
    }
  }

  /**
   * A stance is a disposition, so the world's toll raises it rather than
   * overriding it — nobody leaves for less than the floor.
   */
  function mergeFraction() {
    const planet = PlanetManager.getActive();
    const floor = BuildingManager.findMergeFloorForShare(planet?.mergeMinimum ?? 0) / 100;

    switch (config.merge) {
      case 'floor': return floor;
      case 'generous': return Math.min(1, floor + config.generousMargin);
      case 'half': return Math.max(floor, 0.5);
      case 'all': return 1;
      default: return Math.max(floor, config.merge);
    }
  }

  /**
   * Gated on the beat rather than on readiness alone: harvesting before beat 9
   * would consume its own trigger, and beat 9 has no experience floor to fall
   * back on.
   */
  function maybeHarvest() {
    if (!progression.isLive('overview.firstHarvest')) return;

    const planet = PlanetManager.getActive();
    if (!planet?.isFirstHarvestReady) return;

    const fraction = mergeFraction();
    const soulsBefore = BuildingManager.countSouls();
    const karmaPerSecondBefore = BuildingManager.countKarmaPerSecond();

    const merged = PlanetManager.completeFirstHarvest(fraction);
    if (!planet.isHarvested) return;

    harvests.push({
      planet: planet.id,
      atMs: clock.now(),
      fraction,
      merged,
      soulsBefore,
      soulsAfter: BuildingManager.countSouls(),
      harvestDurationMs: planet.harvestDuration,
      alignment: planet.alignment,
      karmaPerSecondBefore,
      karmaPerSecondAfter: BuildingManager.countKarmaPerSecond(),
    });

    const next = PlanetManager.ahead[0];
    if (next) PlanetManager.reach(next);
  }

  function recordBeats() {
    while (recordedBeats < progression.beat) {
      const atMs = clock.now();

      beatRecords.push({
        index: recordedBeats + 1,
        id: beats[recordedBeats].id,
        atMs,
        gapMs: atMs - lastBeatAt,
        experience: ResourceManager.getTotal('experience'),
        karmaPositive: ResourceManager.getTotal('karma_positive'),
        karmaNegative: ResourceManager.getTotal('karma_negative'),
        souls: BuildingManager.countSouls(),
        planetsFinished: PlanetManager.finished,
      });

      lastBeatAt = atMs;
      recordedBeats += 1;
    }
  }

  function takeSample() {
    const amounts: Sample['amounts'] = {};
    const totals: Sample['totals'] = {};

    for (const type of RESOURCE_TYPES) {
      amounts[type] = ResourceManager.getAmount(type);
      totals[type] = ResourceManager.getTotal(type);
    }

    const counts: Record<string, number> = {};
    for (const id of BuildingManager.buildings) {
      counts[id] = BuildingManager.getBuilding(id)?.count ?? 0;
    }

    samples.push({
      atMs: clock.now(),
      beat: progression.beat,
      souls: BuildingManager.countSouls(),
      reserved: BuildingManager.countReserved(),
      anchorsPlaced: PlanetManager.getActive()?.anchorsPlaced ?? 0,
      excess: getExcess(),
      karmaPerSecond: BuildingManager.countKarmaPerSecond(),
      experiencePerSecond: BuildingManager.countExperiencePerSecond(),
      amounts,
      totals,
      counts,
    });
  }

  while (clock.now() < limitMs) {
    clickDebt += clicksPerTick;
    while (clickDebt >= 1) {
      click();
      clickDebt -= 1;
    }

    clock.advanceBy(TICK_MS);
    pulse();
    await settle();

    recordBeats();

    if (!aimSet && progression.runs('negKarma')) {
      aim.set(config.detent);
      aimSet = true;
    }

    /* Both levers, or the harness never staffs and every world past the first stalls. */
    if (!reserveSet && progression.isLive('details.split')) {
      reserve.set('anchoring', config.anchorFraction);
      reserve.set('refining', config.reserveFraction);
      reserveSet = true;
    }

    if (progression.runs('refining')) refinery.start();
    if (progression.runs('anchoring')) harness.start();

    workManualCohorts();
    buyUpgrades();
    buyCohorts();
    maybeHarvest();
    await settle();

    recordBeats();
    recordArrivals();

    if (clock.now() >= nextSampleAt) {
      takeSample();
      nextSampleAt = clock.now() + config.sampleSeconds * 1000;
    }

    if (allBeatsAt === undefined && progression.beat >= beats.length) allBeatsAt = clock.now();
    if (allBeatsAt !== undefined && clock.now() - allBeatsAt >= config.tailSeconds * 1000) break;

    if (++ticks % PROGRESS_EVERY === 0) {
      onProgress?.({ atMs: clock.now(), beat: progression.beat });
    }
  }

  takeSample();

  return {
    config,
    label: `${policy.label} · ${stanceLabel(config.merge)}`,
    beats: beatRecords,
    samples,
    arrivals: [...arrivals.values()].sort((a, b) => a.index - b.index),
    harvests,
    ladder,
    endedAtMs: clock.now(),
    beatsReached: progression.beat,
    beatsTotal: beats.length,
    stalledOn: stall(),
  };

  /** What the run was still waiting on. An event-only beat can hold forever. */
  function stall() {
    const next = beats[progression.beat];
    if (!next) return undefined;

    const planet = PlanetManager.getActive();

    return {
      beat: next.id,
      planet: planet?.id,
      unmetFirstHarvest: [...(planet?.unmetFirstHarvestConditions ?? [])],
      excess: getExcess(),
    };
  }
}
