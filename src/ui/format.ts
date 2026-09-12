/**
 * Shapes a reading is printed in, where more than one surface prints it. A
 * figure formatted twice is two readings that can disagree; these are the one.
 */

/**
 * Below this the whole-percent step is coarser than the question being asked —
 * near the first-harvest gate a tenth of a percent is the difference between
 * arriving and not.
 */
const FINE = 15;

/** Excess as a magnitude: the side is a word or a badge, so the figure carries no sign. */
export function formatExcess(value: number) {
  const percent = Math.abs(value) * 100;

  return `${percent < FINE ? percent.toFixed(1) : Math.round(percent)}%`;
}
