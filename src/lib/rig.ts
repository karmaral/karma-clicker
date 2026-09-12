/**
 * What the rig *is* and what it therefore looks like, with no live rig in sight.
 * Every harness upgrade moves a capacity and a visual field together, so buying
 * one is something you can see rather than a figure on a panel — the axis and
 * the picture are one purchase (see memory, *visual params are upgrade axes*).
 *
 * Pure, and deliberately a leaf: `harness.svelte.ts` reads its own modifiers
 * through `readAxes`, and the widget lab replays the upgrade ladder through a
 * throwaway set to draw a rig nobody has bought. One definition, so a preview
 * cannot drift off the thing it previews — and the lab never has to mount the
 * managers the live singleton drags behind it.
 *
 * The `DEFAULT_*` literals in `$widgets/planet` are the **starting** values, not
 * the target: every map below runs from the default toward a ceiling as the axis
 * is bought, and never below it. The labs keep reading those defaults directly,
 * so tuning a shape by eye and buying an upgrade stay separate jobs.
 */

import { ANCHOR_MAX, DEFAULT_ANCHOR, DEFAULT_HARNESS } from '$widgets/planet';
import type { AnchorVisual, HarnessVisual } from '$widgets/planet';
import type { ModifierSet } from '$lib/modifiers';
import balance from '$data/balance';

/** Every capacity the upgrades move, as one record. */
export interface RigAxes {
  slots: number;
  riders: number;
  anchors: number;
  perWorker: number;
  clickMs: number;
  /** The lever's finest setting, already resolved off the ladder. Not a rung. */
  step: number;
  /** Bought, not modified — so it is passed in rather than read off the set. */
  lines: number;
}

export interface RigVisuals {
  anchors: AnchorVisual;
  harness: HarnessVisual;
  /** How many poles the rig would put down, clamped to the figures that exist. */
  count: number;
}

export function readAxes(modifiers: ModifierSet, lines: number): RigAxes {
  const steps = balance.harness.splitSteps;

  /** Rungs down the split ladder, not a fraction — see `ModifierStat`. */
  const precision = modifiers.apply(0, 'step');

  return {
    slots: modifiers.apply(balance.harness.slots, 'slots'),
    riders: modifiers.apply(balance.harness.riders, 'riders'),
    anchors: modifiers.apply(balance.harness.anchors, 'anchors'),
    perWorker: modifiers.apply(balance.harness.perWorker, 'work'),
    clickMs: modifiers.apply(balance.harness.clickMs, 'press'),
    step: steps[Math.min(Math.round(precision), steps.length - 1)],
    lines,
  };
}

/**
 * How far along an axis you are, 0…1. Hyperbolic rather than linear against a
 * ceiling: an axis has no top — `slots` and `riders` are bought in thousands —
 * so a picture that saturated would stop reading the purchase. `half` is the
 * bought amount that spends half the range.
 */
function progressOf(value: number, base: number, half: number) {
  const gained = Math.max(0, value - base);

  return gained / (gained + half);
}

/** The default, moved toward `to` by `t`. Never below what was authored. */
function toward(from: number, to: number, t: number) {
  return from + (to - from) * Math.max(0, Math.min(1, t));
}

/** Rungs bought off the split ladder, as a share of the ladder's length. */
function stepProgressOf(step: number) {
  const steps = balance.harness.splitSteps;
  const at = steps.indexOf(step);

  return at <= 0 ? 0 : at / (steps.length - 1);
}

/**
 * Work slots make the solid bigger; efficiency sharpens it — more sides and a
 * deeper chamfer, so a fast rig reads as machined rather than driven in. Press
 * efficiency is the ink: a heavier hand draws a heavier edge.
 *
 * Riders fill the cage — more loops, more levels — and lines widen its reach,
 * because a line is another cohort strung onto it. Granularity twists: the finer
 * the lever, the more the family weaves rather than stacks.
 */
export function rigVisualsAt(axes: RigAxes): RigVisuals {
  const slotProgress = progressOf(axes.slots, balance.harness.slots, 24);
  const riderProgress = progressOf(axes.riders, balance.harness.riders, 2_000);
  const workProgress = progressOf(axes.perWorker, balance.harness.perWorker, 0.4);
  const pressProgress = progressOf(axes.clickMs, balance.harness.clickMs, 500);
  const lineProgress = progressOf(axes.lines, 0, 4);

  return {
    anchors: {
      ...DEFAULT_ANCHOR,
      size: toward(DEFAULT_ANCHOR.size, 1.8, slotProgress),
      sides: Math.round(toward(DEFAULT_ANCHOR.sides, 8, workProgress)),
      chamfer: toward(DEFAULT_ANCHOR.chamfer, 0.45, workProgress),
      edgeWidth: toward(DEFAULT_ANCHOR.edgeWidth, 2.4, pressProgress),
    },
    harness: {
      ...DEFAULT_HARNESS,
      density: toward(DEFAULT_HARNESS.density, 1.6, riderProgress),
      levels: Math.round(toward(DEFAULT_HARNESS.levels, 3, riderProgress)),
      span: toward(DEFAULT_HARNESS.span, 2.4, lineProgress),
      twist: toward(DEFAULT_HARNESS.twist, 3.2, stepProgressOf(axes.step)),
    },
    count: Math.max(1, Math.min(ANCHOR_MAX, Math.round(axes.anchors))),
  };
}
