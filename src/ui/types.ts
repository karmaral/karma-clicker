export type BadgeKind =
  | 'xp'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'pos'
  | 'neg'
  | 'both'
  | 'any';

export type LabelSize = 'default' | 'sm';

export type FigureSize = 'xl' | 'lg' | 'md' | 'base';

export type MeterFill = 'ink' | 'pos' | 'neg';

export type MeterAlign = 'start' | 'end';

export interface MeterTick {
  at: number;
  strong?: boolean;
}

export type ButtonVariant = 'filled' | 'outline';

export type ChipState = 'affordable' | 'unlocked' | 'approaching';

export type TabsSize = 'default' | 'sm';
