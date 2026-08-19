/**
 * Red is the one token that exists polarised, so it carries karma's three hatch
 * treatments at its own hue — `red` itself stays for an unrouted red, which
 * `PolarizedResourceType` still lets data declare.
 */
export type BadgeKind =
  | 'xp'
  | 'red'
  | 'red-pos'
  | 'red-neg'
  | 'red-both'
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

export type ChipStatus = 'affordable' | 'unlocked' | 'approaching';

export type TabsSize = 'default' | 'sm';
