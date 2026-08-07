import type { BadgeKind } from '$ui';

export type StageKind = 'light' | 'dense';

export interface Stage {
  kind: StageKind;
  at: string;
}

export interface ProbeOutput {
  kind: BadgeKind;
  amount: string;
  unit?: string;
}

export interface ProbeCost {
  kind: BadgeKind;
  amount: string;
  affordable?: boolean;
}

export interface Probe {
  id: string;
  count: string;
  name: string;
  description: string;
  milestone?: number;
  aim: number;
  lean: string;
  aimNote?: string;
  unaimable?: boolean;
  output: ProbeOutput;
  cost: ProbeCost;
}
