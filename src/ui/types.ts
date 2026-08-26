/**
 * Red is the one token that exists polarised, so it carries karma's three hatch
 * treatments at its own hue — `red` itself stays for an unrouted red, which
 * `PolarizedResourceType` still lets data declare.
 */
export type BadgeKind =
  | 'xp'
  | 'wisdom'
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

export type LabelTone = 'active' | 'inactive' | 'disabled';

export type FigureSize = 'hero' | 'xxl' | 'xl' | 'lg' | 'md' | 'base';

export type MeterFill = 'ink' | 'pos' | 'neg';

export type MeterAlign = 'start' | 'end';

export interface MeterTick {
  at: number;
  strong?: boolean;
}

export type ButtonVariant = 'filled' | 'outline';

/**
 * Where the sub sits. `stacked` is a caption under a verb; `spread` puts the two
 * on one rail, the verb at one end and a reading at the other — which is what a
 * button wide enough to be a bar wants, and what a caption centred under one
 * cannot do.
 */
export type ButtonLayout = 'stacked' | 'spread';

/** `arriving` is neither: unpriced, and granted the moment `unlocks_at` holds. */
export type ChipStatus = 'affordable' | 'unlocked' | 'approaching' | 'arriving';

export type TabsSize = 'default' | 'sm';
