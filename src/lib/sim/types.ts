import type { Polarity, ResourceType } from '$types';
import type { Detent } from '$lib/aim';

export type PolicyId = 'cheapest' | 'payback';

/**
 * A disposition held across every harvest, not a per-planet plan — which is
 * both how a player behaves and what keeps the sweep to a handful of runs.
 * A bare number is a literal fraction; the world's toll still raises it.
 */
export type MergeStance = 'floor' | 'generous' | 'half' | 'all' | number;

export interface SimConfig {
  policy: PolicyId;
  merge: MergeStance;
  hours: number;
  clicksPerSecond: number;
  reserveFraction: number;
  detent: Detent;
  sampleSeconds: number;
  /** What `generous` adds on top of the floor. */
  generousMargin: number;
  maxBuysPerTick: number;
  /** Kept running after the last beat, so the tail of the curve is drawn. */
  tailSeconds: number;
  /** Dotted paths into the data files: `basic.cost`, `balance.aim.reaimPenalty`. */
  overrides: Record<string, number>;
}

/** What one purchase would cost and earn. The policy sees nothing else. */
export interface Candidate {
  id: string;
  cost: number;
  costType: ResourceType;
  /** Of the resource the purchase is priced in, so red and karma compare alike. */
  marginalPerSecond: number;
  paybackSeconds: number;
}

export interface Policy {
  id: PolicyId;
  label: string;
  next(candidates: Candidate[]): Candidate | undefined;
}

export interface BeatRecord {
  index: number;
  id: string;
  atMs: number;
  gapMs: number;
  experience: number;
  karmaPositive: number;
  karmaNegative: number;
  souls: number;
  planetsFinished: number;
}

export interface Sample {
  atMs: number;
  beat: number;
  souls: number;
  reserved: number;
  /** Anchors down on the world being stood on — what the split's cost bought. */
  anchorsPlaced: number;
  excess: number | undefined;
  karmaPerSecond: number;
  experiencePerSecond: number;
  amounts: Partial<Record<ResourceType, number>>;
  totals: Partial<Record<ResourceType, number>>;
  counts: Record<string, number>;
}

/** One harvest as it happened. The sweep is several runs of these, compared. */
export interface HarvestRecord {
  planet: string;
  atMs: number;
  fraction: number;
  merged: number;
  soulsBefore: number;
  soulsAfter: number;
  harvestDurationMs: number;
  alignment: Polarity;
  karmaPerSecondBefore: number;
  karmaPerSecondAfter: number;
}

export interface LadderRow {
  cohort: string;
  count: number;
  cumulativeCost: number;
  /** What the next one costs from here — what `paybackSeconds` is repaying. */
  nextCost: number;
  costType: ResourceType;
  karmaPerSecond: number;
  experiencePerSecond: number;
  /** Of the cost resource, so red and karma cohorts compare on one column. */
  marginalPerSecond: number;
  paybackSeconds: number;
}

/** Aim- and run-independent: what merging this share of a soul count would buy. */
export interface MergeCurveRow {
  planet: string;
  fraction: number;
  merged: number;
  soulsLeft: number;
  meetsMinimum: boolean;
  harvestDurationMs: number;
  experiencePerSecond: number;
  karmaPerSecond: number;
}

/** Why a run stopped short. A beat with no floor can hold forever, silently. */
export interface Stall {
  beat: string;
  planet: string | undefined;
  unmetFirstHarvest: string[];
  excess: number | undefined;
}

export interface SimResult {
  config: SimConfig;
  label: string;
  beats: BeatRecord[];
  samples: Sample[];
  harvests: HarvestRecord[];
  ladder: LadderRow[];
  endedAtMs: number;
  beatsReached: number;
  beatsTotal: number;
  stalledOn?: Stall;
}

export interface SimProgress {
  atMs: number;
  beat: number;
}