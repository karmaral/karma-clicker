/** One line on a chart. Points are `[x, y]` in the data's own units. */
export interface Series {
  label: string;
  color: string;
  /** SVG dash pattern, so two runs on one axis stay apart without a second hue. */
  dash?: string;
  points: [number, number][];
}
